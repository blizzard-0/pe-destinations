# Discussion

## Overview

_To be written once all sections are complete._

## Initial Assessment

_Coming next._

## Section 1: Project Setup

### Version control

- **Baseline commit first.** Before changing anything, I committed the original code to `main`. That way every change I make can be reviewed as a diff against what was provided.
- **One branch per section.** Each section gets its own branch (`section-1-project-setup`, `section-2-database-api`, `section-3-user-interface`), which is merged into `main` once it's complete.

### Environment variables

- **Ignored `.env` before the first commit.** The original `.gitignore` only covered `.env*.local`, so `.env` itself would have been committed. Right now it only contains a commented-out placeholder, but this is where the real `DATABASE_URL`, including the database password, will go. I fixed this before the first commit because once a file is in git history, deleting it later doesn't remove it from older commits. This is the only change included in the baseline commit, since it had to be in place before anything was committed.
- **Added `.env.example`.** With `.env` no longer tracked, this file documents which variables the app needs and shows the expected format with safe local defaults. Getting set up locally is just `cp .env.example .env`.

## Section 2: Database & API

## Section 3: User Interface

## Tradeoffs & Deliberate Omissions

## What I'd Do With More Time
