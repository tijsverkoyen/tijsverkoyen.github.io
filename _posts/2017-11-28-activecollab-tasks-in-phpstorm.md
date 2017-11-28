---
layout: post
title:  "ActiveCollab tasks in PhpStorm"
date:   2017-11-28 12:13:14
image:  2017-11-28-activecollab-tasks-in-phpstorm.jpg
comments: false
language: en
---
As there is no support for [ActiveCollab](https://activecollab.com/) in [PhpStorm](https://www.jetbrains.com/phpstorm/)
I wrote a hackish implementation. With this hack I can see my tasks inside PhpStorm. You can use it yourself, by 
[downloading this package](https://github.com/tijsverkoyen/active-collab-generic-server) and installing it on your server.

As it requires some configuration, I wrote this step by step guide.

### Obtain the needed Template Variables

First we need to obtain some data we will need later on. This data is returned by our package, but we need
to construct an url.

We will need to append some GET parameters to our `/login` url.

* username: your ActiveCollab Username
* password: your ActiveCollab Password
* account: your ActiveCollab instance number, if your Active Collab url is: https://app.activecollab.com/123456, this is `123456`.

The final url will look something like: [https://foo.bar.tld/login?username=john@doe.com&password=super-secret-password&account=123456](#)

If you open this url in a browser it will result in a JSON-object like below

    {
      token: "12-3858f62230ac3c915f300c664312c63f",
      acArl: "https://app.activecollab.com/123456",
      userId: 1337
    }

### Configure the Generic Task Server

* Go to `Tools → Tasks & Contexts → Configure Servers`.
* Add a new `Generic` server type.
* Enter the url (eg: https://foo.bar.tld).
* Check `Login anonymously`.
* Open the tab `Server Configuration`.
* Click `Manage Template Variables`.
* Add the needed variables based on the data we earlier retrieved. You should end up with something like:

<div class="thumbnail" style="max-width: 284px;">
  <img class="img-responsive" src="https://raw.githubusercontent.com/tijsverkoyen/active-collab-generic-server/master/assets/2_template_variables.png">
</div>

* Configure the `Task List URL`: {serverUrl}/task-list?token={token}&acUrl={acUrl}&userId={userId}

<div class="thumbnail" style="max-width: 383px;">
  <img class="img-responsive" src="https://raw.githubusercontent.com/tijsverkoyen/active-collab-generic-server/master/assets/3_server_configuration.png">
</div>

* Choose `JSON` as the Response Type and add the correct paths for each property as indicated in the screenshot.

If you need more information, you can check the [ActiveCollab Generic Server repository on Github](https://github.com/tijsverkoyen/active-collab-generic-server).
