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

### Slack


### VoipCenter

In VoipCenter we set up a webhook to our server. So every time we have an inbound or outbound call we get a notification on the server.








nodejs

webhooks

websockets

slack-client





