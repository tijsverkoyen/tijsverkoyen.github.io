---
layout: post
title:  "Scaling Gitlab runner on Google Cloud Platform"
date:   2018-08-08 09:23:00
image:  2018-08-07-scaling-gitlab-runner-on-google-cloud-platform.gif
comments: false
---
At [SumoCoders](https://sumocoders.be/) we have a self-hosted GitLab instance.

For each project, we have some CI-jobs. Some of them are as simple as checking 
code styles, others are more complex like building assets. These jobs are 
handled by `gitlab-runners`.

In the past we used several droplets (servers) on Digital Ocean as `gitlab-runners`. 
These instances were running 24/7, and could only handle a limited number of 
jobs.

With platforms like Google Cloud Platform we ar able to use resources on demand.
With that we can realize a more cost effective setup.

In this blog post we will look at how you can get this up and running. 

## 1. Create a project on Google Cloud Platform

Log in to the <a href="https://console.cloud.google.com/projectcreate"><abbr title="Google Cloud Platform">GCP</abbr> Console</a> and 
create a new project. I named mine `GitLab Autoscale Runners`, which resulted 
in the project ID: `gitlab-autoscale-runners`. You will need this project ID 
later on.

## 2. Install `gcloud` (optional)

If you have not installed it yet, install it now. You can follow the guide 
at: <https://cloud.google.com/sdk/docs/>.

## 3. Create an instance for the `gitlab-runner`

With the `gcloud` cli tool you can create instances from the commandline, I 
used the command below:

{% highlight shell %}
gcloud compute --project=gitlab-autoscale-runners instances create gitlab-runner
    --zone=europe-west1-b
    --machine-type=f1-micro
    --scopes=https://www.googleapis.com/auth/compute
    --image-family=ubuntu-1604-lts
    --image-project=ubuntu-os-cloud
    --boot-disk-size=30GB
{% endhighlight %}

This creates an instance named `gitlab-runner`, with the following specs:

* As we live and work in Belgium we prefer a server nearby, this is done by using
  the `--zone` flag. <small>([All available zones](https://cloud.google.com/compute/docs/regions-zones/))</small>
* As minimal as possible, as we will use docker+machine to run the jobs itself. 
  The node will only be an orchestrator and does not need  a lot of resources. 
  I chose a `f1-micro` for the machine-type.
* Have a familiar OS, like Ubuntu.

## 4. Install the required components

To be able to install packages on the instance you need to SSH into the instance.
You can use the `gcloud` cli tool:

```shell
gcloud compute ssh gitlab-runner
```

Once logged in you can install the components:

1. Install Docker. Follow the steps on: <https://docs.docker.com/cs-engine/1.12/#install-on-ubuntu-1404-lts-or-1604-lts>.
2. Install Docker Machine, follow the steps on: <https://docs.docker.com/machine/install-machine>.
3. Install the GitLab Runner. Documented on: <https://docs.gitlab.com/runner/install/linux-repository.html#installing-the-runner>. You should follow the steps for Ubuntu.

## 5. Install a cache server

For now (waiting on [support Google Cloud Storage as cache target](https://gitlab.com/gitlab-org/gitlab-runner/issues/1773))
we will use our own caching-server, running on the gitlab-runner instance.

So ssh to the instance again if needed and run the following command after 
becoming root (`sudo su -`):

```shell
docker run -it --restart always -p 9000:9000 
    -v /srv/minio/config:/root/.minio 
    -v /srv/minio/files:/export 
    --name minio minio/minio:latest 
    server /export
```

The `accessKey` and `secretKey`, can be found in `/srv/minio/config/config.json`. 

This will start a [Minio](https://minio.io/) container which will always restart. 
You can stop the command, as the container will restart in the background.

Create a directory: `mkdir /srv/minio/files/gitlab-runner-cache`.

## 6. Register the runner

Once done you should register the runner, documented on: 
<https://docs.gitlab.com/runner/register/index.html>. In essence, it is as
simple as running: `sudo gitlab-runner register` and answering the questions.

When asked for the executor you need to answer: `docker+machine`

## 7. Configure the runner

This is done in `/etc/gitlab-runner/config.toml`. Some sections are already 
configured, others might need special attention.

### 7.1 Configure the concurrent runners

You can set `concurrent` to a number that fits your needs, I set it to `10`. 
This is the number of runners that will be spawned.

### 7.2 Configure the cache

The `runners.cache` section is used for caching across jobs. We have [installed
our own cache server](#5-install-a-cache-server), so we should configure the runner to use it.

```toml
[runners.cache]
    # As long as Google Cloud Storage is not supported this needs to be s3
    Type = "s3"
    # The hostname is based on the name of your Google Compute VM instance
    ServerAddress = "gitlab-runner:9000"
    AccessKey = "$your Minio accessKey"
    SecretKey = "$your Minio secret"
    # The name should be the same as the name of the folder you created in step 5
    BucketName = "gitlab-runner-cache"
    # We didn't configure any certificates, so use the insecure-flag
    Insecure = true
    # Shared as we want the cache to be available across the different runners
    Shared = true
```

See [Advanced Configuration → runners.cache](https://docs.gitlab.com/runner/configuration/advanced-configuration.html#the-runners-cache-section) 
for more information on specific configuration keys.

### 7.3 Configure autoscaling

```toml
[runners.machine]
    # The number of always active machine
    IdleCount = 0
    # The number of seconds a machine has to be idle before removal
    # Google invoices per second after the first minute so it can be something low.
    IdleTime = 300
    MachineDriver = "google"
    MachineName = "auto-scale-runner-%s"
    # Our machine needs only to be available during the week.
    OffPeakPeriods = [
      "* * 0-7,20-23 * * mon-fri *",
      "* * * * * sat,sun *"
    ]
    OffPeakIdleCount = 0
    OffPeakIdleTime = 300
    MachineOptions = [
      "google-project=gitlab-autoscale-runners",
      # The machine type to use, for our needs a n1-standard-1 is enough
      "google-machine-type=n1-standard-1",
      "google-machine-image=coreos-cloud/global/images/family/coreos-stable",
      "google-tags=gitlab-ci-slave",
      # We use Preemptible VM's as we don't need them long and we are cheapo's
      "google-preemptible=true",
      # Make sure this is the same zone as your base instance
      "google-zone=europe-west1-b",
      # Let the machines use internal IPs for communication
      "google-use-internal-ip=true"
    ]
```

See [Advanced Configuration → runners.machine](https://docs.gitlab.com/runner/configuration/advanced-configuration.html#the-runners-machine-section) 
for more information on specific configuration keys. See [MachineOptions for Google Compute Engine](https://docs.docker.com/machine/drivers/gce/#options) 
for more information on the machine options. 


### Wrap-up

You should end up with a file looking like below.

```toml
concurrent = 10
check_interval = 0

[[runners]]
  name = "Google Cloud GitLab Runner"
  url = "$your GitLab instance url"
  token = "$your GitLab Runner token"
  executor = "docker+machine"
  [runners.docker]
    tls_verify = false
    image = "alpine"
    privileged = false
    disable_cache = false
    volumes = ["/cache"]
    shm_size = 0
  [runners.cache]
    Type = "s3"
    ServerAddress = "gitlab-runner:9000"
    AccessKey = "$your Minio accessKey"
    SecretKey = "$your Minio secret"
    BucketName = "gitlab-runner-cache"
    Insecure = true
    Shared = true
  [runners.machine]
    IdleCount = 0
    IdleTime = 600
    MachineDriver = "google"
    MachineName = "auto-scale-runner-%s"
    OffPeakPeriods = [
      "* * 0-7,20-23 * * mon-fri *",
      "* * * * * sat,sun *"
    ]
    OffPeakIdleCount = 0
    OffPeakIdleTime = 1200
    MachineOptions = [
      "google-project=gitlab-autoscale-runners",
      "google-machine-type=n1-standard-1",
      "google-machine-image=coreos-cloud/global/images/family/coreos-stable",
      "google-tags=gitlab-ci-slave",
      "google-preemptible=true",
      "google-zone=europe-west1-b",
      "google-use-internal-ip=true"
    ]
```

Optionally you can restart the runner (`sudo gitlab-runner restart`) but the 
changes will be picked up automatically.


## Credits

Credits where credits due, I followed the steps documented in 
[Autoscaling Gitlab-CI builds on preemptible Google-Cloud instances](https://webnugget.de/autoscaling-gitlab-ci-builds-on-preemptible-google-cloud-instances-2) 
by Christian. In the steps above I added some extra's and tried to clarify 
things I spend time on figuring it all out.
