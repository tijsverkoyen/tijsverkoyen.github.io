---
layout: post
title:  "Active Collab, Errbit, VoipCenter and GitLab notifications in Slack"
date:   2016-01-01 13:37:01
image:  2016-06-20-slack-active-collab-errbit-voipcenter-gitlab.gif
comments: true
---
TL;DR: I wrote something to show notifications in specific channels from Active Collab, Errbit and GitLab, and I wanted
to brag about it.

At SumoCoders we use some tools, each with their own speciality. We use separate tools because we believe there is no 
"all-in-one-holy-grail"-application which will fit our needs, nor will it fit the ever changing way of work in our company. 

## Slack

We use [Slack](https://slack.com/) to discus everything about a project. Each project
gets it onw specific channel. The purpose is to have al communication about the project in that single channel, so 
everybody who works on the project or is interested in the project can follow all communication.

On a personal note: although Slack promises to "be less busy" when you are using their app, I think with all the possible 
integrations it will increase the noise in your channels, and therefore people will spend more time on communication.

## Active Collab

[Active Collab](https://activecollab.com/) is a project management tool. It allows us to organize tasks for a specific project.
It is also used for tracking time spent, and we use a custom written application for planning based on the estimates set on
a task.

So wouldn't it be nice to see a message in Slack when a new task is created, or a task is completed. Active Collab offers
a native integration, it kinda sucks for us for some reasons:

1. We have over 600 projects, with their interface we had to add each integration with about 5 clicks.
2. Their implementation introduces a lot of noise in the channel as they post a lot of events (task creation, completion, 
   move, time or expenses are logged, user invitations, ...).

## Errbit

[Errbit](http://errbit.com/) is an Airbrake compliant error catcher. Actually it is an interface where errors are collected,
grouped per project and where the errors can be managed. In our projects we have an error-handler which posts the errors
to our Errbit-instance.

So wouldn't it be nice to see a message when an error occurs? Errbit offers a native integration, but it has the disadvantage 
that you need a specific hook url per project. Which would require a lot of administration.

## VoipCenter + TeamLeader

We use [VoipCenter](http://www.voipcenter.be/) as our PBX provider, in short, it is an online VOIPBox, and we use [TeamLeader](http://www.teamleader.eu/en)
as a CRM.

Wouldn't it be nice if we got the client-details in Slack every time the phone rings?

## GitLab (CE)

Because we don't like to pay a [gazilion dollars/euro's](https://github.com/blog/2164-introducing-unlimited-private-repositories) 
to be able to have Git repository management, we have used [GitLab](https://about.GitLab.com/) CE since (I think) the 
start of SumoCoders. 

We use GitLab for Pull Request, Code reviewing, ... So every time a PR is made it has to be reviewed by another person. So 
wouldn't it be nice if we get notifications when a new PR is made, a PR is merged?

Integrated in GitLab is [GitLab CI](https://about.GitLab.com/GitLab-ci/), so when a PR is made it will run our tests. Wouldn't
it be nice if we got notified if a build passed or failed?

GitLab offers a "Slack-service", which is ok, but just like Errbit it requires a lot of set up time.

## How does it work?

So as you can see we had some "specific" needs, and the native solutions didn't met these requirements. The only option
was to build it the way we want.

### The architecture

Actually one thing all of the products had in common: they have webhooks. So I have a "server" which acts on those webhooks.

On the other end I have a "client" which is responsible to send the actual messages to Slack. I used a client as I can 
see other possible "clients", eg: push notifications in an iOS-app, ...

Everything is written in nodejs, with the [Express](http://expressjs.com/)-framework.

The client is connected with websockets to the server, so we can push messages from the server to the client when needed.
It is the responsibility of the client to translate the incoming messages into nice formated Slack-messages.

### A message

The message object is pretty simple it has 3 properties:

* project
* text
* data

In the Slack client we use the project to decide in which channel the message needs to be posted, the text-property contains
the real message, and the data can be used to enrich the Slack-messages.

### Slack-integration

To configure everything without a lot of manual setup, I created a [Slack-Slash-command](https://api.slack.com/slash-commands).
This command has several subcommands.

* `/sumo help`, this will show a usage-message to the user.
* `/sumo project`, this will show which Active Collab projects are linked to the current channel. 
* `/sumo project $id`, this will link the project with the given $id to the current channel. 
* `/sumo gitlab`, this will show which Gitlab projects are linked to the current channel. 
* `/sumo gitlab $namespace/$project`, this will link the given repo to the current channel, and configure the needed webhooks.
* `/sumo errbit`, this will show which Errbit applications are linked to the current channel. 
* `/sumo errbit $api-key`, this will link the given Errbit application to the current channel, and configure the needed webhooks. 

As you will understand this command is the core of the integration, as it will save the mapping between the different
applications and the Slack-channel, this is stored in a JSON-configuration on the server.

This JSON-configuration is also used by the client to map the incomming messages to the correct Slack-channel.

### Active Collab-integration

In Active Collab we configured a general webhook to our server, which sends us a lot of notification each time something 
happens in AC. At the server we will ignore al requests except for those when a task is created or completed.

Once we receive such a request we will convert the incoming call into a nice object and find more details about the task
which will be converted by the Slack-client into a nice message, which shows the tasknumber, taskname, assignee, due-date, 
estimate (if provided) and which is also a link to the task in Active Collab.

<div class="thumbnail" style="max-width: 722px;">
    <img src="/assets/posts/2016-06-20-slack-active-collab-1.png" class="img-responsive">
</div>

In the native implementation it showed a lot more information, for instance the whole description of the task, which is
kind of useless in the Slack-channel.

When a task is completed it shows:

<div class="thumbnail" style="max-width: 722px;">
    <img src="/assets/posts/2016-06-20-slack-active-collab-2.png" class="img-responsive">
</div>

Where the native implementation shows the full information again, which is pointless, because the person who was assigned
only needs all the information, the other channel-members should only know that the task is completed.

### Errbit-integration

In the past we received a mail for every 1<super>st</super>, 10<super>th</super>, 100<super>th</super, ... time an error 
occured via mail. While now we receive it every 1, 2, 3 and then every 10<super>th</super>-time, directly in the channel.

<div class="thumbnail" style="max-width: 722px;">
    <img src="/assets/posts/2016-06-20-slack-errbit.png" class="img-responsive">
</div>

This is not done by the native Slack-integration, but it is handled by our own implemenation because with the native 
implementation every occurence is posted in the channel. The configuration of the webhook is done wit the 
`/sumo errbit $api-key`-command.

### VoipCenter-integration

In VoipCenter we set up a webhook to our server. So every time we have an inbound or outbound call we get a notification 
on the server. That incoming call contains a lot of information.

Based on the information we build a `Payload`-object, and we check if it is an inbound call and it is the start of the call.
In that case we will search for the phone-number in the TeamLeader-contacts and companies.

When a result is found (or not) we build a message object. This message is dispatched to the client.

The Slack-client will transform the message into a message which contains the basic information about the company (name + phone), 
or contact (name, compant, cell, phone, email), as you can see in the screenshot below:

<div class="thumbnail" style="max-width: 722px;">
    <img src="/assets/posts/2016-06-20-slack-voipcenter-teamleader.png" class="img-responsive">
</div>

### GitLab-integration

When we link a GitLab-repo to a channel the webhook is configured by the `/sumo gitlab $namespace/$project`-command.

This shows a message in Slack every time a Merge Request is created, with the name of name and assignee. When a Merge Request
is merged or closed it also shows a message.

<div class="thumbnail" style="max-width: 722px;">
    <img src="/assets/posts/2016-06-20-slack-gitlab-merge-request.png" class="img-responsive">
</div>

Once again the merge is handled differently then the creation of a new Merge Request to not clutter the channel with 
useless information.

When a build succeeds/fails a message will be shown in the channel like this:

<div class="thumbnail" style="max-width: 722px;">
    <img src="/assets/posts/2016-06-20-slack-gitlab-build.png" class="img-responsive">
</div>

## What did I learn

I personally learned a lot. I learned how to work with nodejs and Express. But I think the best part of this (unfinished) 
project is that most software-developers really should think about their API's. 

Most of the API's are designed for internal use, not for external use, or their design is useless because you need a lot
of calls to get all the data you need. For instance:

To get the contact-details for a company or contact in TeamLeader I have to loop all contacts, companies until I find one, because 
it <strike>is not</strike> was not possible to search based on a phone-number. The next problem was that I didn't have the full
detail of that contact/company directly, therefore an extra call is needed.

So if a company does not yet exists, it would take:

    ceil(total number of contacts / maximum paging amount) + ceil(total number of companies / maximum paging amount)

In our case: 

    ceil( 1696 / 100 ) + ceil( 1289 / 100 ) = 30

Also, a contact can be linked to multiple company, but in the details of a contact we only receive the id's for the linked 
companies. So if the contact is on the last page this wil result in a bunch of calls:

    ceil(total number of contacts / maximum paging amount) + contact details + (number of linked companies * company details)
    
For example, for a client linked to 2 companies:

    ceil( 1696 / 100) + 1 + (2 * 1) = 20
 
    
On the other side there are the webhooks, the same applies. The problem in most cases is that the data that is sent is 
just not enough to handle it without making a lot of extra calls to the API. Or in some cases it is really inconsitent.

For example, in GitLab the webhooks for the Merge Request contain data about the user and project, while in the Build-request 
it is not provided, or it is incomplete.

<br />
What I took away is that you should log every request to be able to debug everything properply, and write serious defensive 
code, which tries to take every possible situtation into account.
