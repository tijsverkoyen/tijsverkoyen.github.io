---
layout: post
title:  "Rebuild & Reindex messages in Mail.app"
date:   2017-05-28 09:37:00
image:  2017-05-28-rebuild-reindex-messages-in-mail-app.png
comments: true
---
For some reason Mail.app will stop finding messages, or just crashes, or ... 
In order to fix this, I execute the following steps:

1. Close Mail.app
2. Open Terminal
3. Enter: `cd ~/Library/Mail/V4/MailData/`
4. Enter: `rm Envelop\ Inde*`

*Remark*: This is just a post for myself, so I don't spend time looking for 
the correct files to delete.
