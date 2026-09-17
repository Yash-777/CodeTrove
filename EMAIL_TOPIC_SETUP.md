# Email Topic Setup Guide

This document explains how the new email topic was created and the exact files that were changed.

## 1) Topic metadata file

A new category file was added at:

- `src/data/topics/email.js`

This file defines the topic metadata for the Email category, including:
- `slug`
- `title`
- `summary`
- `tags`
- `gifUrl`
- `relatedTool`

## 2) Topic markdown content

The article content was created at:

- `src/data/topics/email/sending-email/content.md`

This file contains the actual topic content, including:
- links to disposable email providers
- a JavaScript example using Nodemailer
- a Java example using JavaMail
- setup notes and best practices

## 3) Register the category in the app

The app reads categories from:

- `src/data/topics/index.js`

This file must import the new category file and include it in the `CATEGORIES` array. That is the key step that makes the new topic appear in the sidebar and topic pages.

## 4) Why this is enough

The app uses a content-driven structure:
- metadata lives in the category data file
- full article text lives in the markdown file
- the app index wires everything together automatically

No component changes are needed for a regular content topic. The page system already loads markdown content using `getTopicContent()`.

## 5) Summary of the change flow

1. Create the new category file, such as `email.js`
2. Add the topic object to that file
3. Create the matching markdown folder and `content.md`
4. Import the category and add it to `src/data/topics/index.js`
5. Start the app and verify the topic loads

## 6) Example of the files involved

- `src/data/topics/email.js`
- `src/data/topics/email/sending-email/content.md`
- `src/data/topics/index.js`

The app automatically renders the new Email topic once the category is registered in the main index file.
