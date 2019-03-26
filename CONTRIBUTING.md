# How to contribute

Guideline for anyone that wants to contribute to the project. 
It covers the workflow the project uses, steps to do a pull request, and things to have in mind. 
Please read everything before doing anything!

## Project workflow

There are two main branches, master and devolop.
Master will only have stable releases and develop will have all the work between them, once develop
reaches the desire stable point for the new release it is merged into master.

Hotfixes will branch off master and be merged into both master and develop. Features will branch 
off and be merged into develop.

## Hotfixes
Before starting working on a hotfix create an issue reporting the bug, there we will discuss the 
best approach to fix it. Once the implementation for the hotfix is decided you can start working 
on it and then do a pull request.

## Features
Before starting working on a feature create an issue so we can discuss if it's really needed and, 
if so, what approach to take. Once the feature gets accepted you can start working on it and then 
do a pull request.

Desired features would be:
- Small changes (ex.: how some bot's commands work)
- Improvements (ex.: reusable code, unit tests)

Completely new features (like a new bot command) won't be accepted, unless is needed for one of 
the points above (ex.: command to run unit test).

## How to pull request

Steps to follow to do a pull request for a hotfix/feature.

### Forking and cloning
- Fork the repository so you have your own.
- Clone your repository:
```
$ git clone https://github.com/USERNAME/InitialB.git
```
- You should have a InitialB directory. Move into it:
```
$ cd InitialB
```
- Set up a reference to the original repository, we will named it upstream.
```
$ git remote add upstream https://github.com/Shacaa/InitialB.git
$ git fetch upstream
```
This way if more work has been added to the original repository, since you have forked it, you 
will be able to update yours. Lets say you want to update your master branch, you would have to do this:
```
# in case you were in another branch (same with develop)
$ git checkout master

# update your master with upstream/master (same with develop)
$ git pull upstream master
```

### Branching
- Before creating your hotfix/feature branch be sure to be in master (develop if feature) and have 
it updated with the original repository (upstream):
```
# if feature is the same but with develop
$ git checkout master
$ git pull upstream master
```
- Create a new branch with a short and descriptive name:
```
# creates new branch and puts you in that branch
git checkout -b branch_name
```
- (Optional) After creating a local branch I use the following commands to make sure it's properly 
"linked" with the remote branch, so to push/pull commits to/from it I can just do "git push/pull":
```
# push the new branch to remote repository
$ git push origin branch_name

# set upstream of local branch to be the remote branch
$ git branch branch_name -u origin/branch_name
```

### Issuing a pull request
- When you go to your fork's branch on GitHub, you should see a line saying how many commits ahead 
your branch is from master/develop.
- If you click where it says "Pull request" it will open a form that will let you issue a pull 
request on the original repository.
- Use an explicit title for the PR and on the description put a link to the original issue you did 
to report the bug/feature (you can do this just by typing #N, N being the issue's number).
- Once done just click "Create a pull request". For now in case of merge conflicts they will be 
solved by me before merging the branch.
- Is very possible that after the code review of it, if needed, you will have to make more work 
into the branch. So keep an eye on it!

### Deleting the branch
- After your pull request gets merged, there's one last thing you should do: delete your git branch. 
To do it just use these commands:
```
# delete your branch locally
$ git branch -d branch_name

# then delete its remote branch
$ git push origin -d branch_name
```
- If your branch didn't get merged you should use -D instead of -d.

Looking forward to your contributions!

Shaca