#!/bin/ksh
CURR_BRANCH=$(git branch --show-current)
if [ "$CURR_BRANCH" != "master" -a "$CURR_BRANCH" != "main" ]; then
  echo "This script must be executed with the master or main branch checked out. You are currently on branch: $CURR_BRANCH"
  exit 2
fi

REMOTES=$(git remote)
if [ $(echo "$REMOTES" | egrep -q "^shared-trial$"; echo $?) -ne 0 ]; then
  echo "Adding trial remote..."
  git remote add shared-trial https://github.com/Phennecs/c360-privacy-center-trial.git
fi
if [ $(echo "$REMOTES" | egrep -q "^shared$"; echo $?) -ne 0 ]; then
  echo "Adding prod remote..."
  git remote add shared https://github.com/Phennecs/c360-privacy-center.git
fi
if [ $(echo "$REMOTES" | egrep -q "^shared-pg9$"; echo $?) -ne 0 ]; then
  echo "Adding prod pg9 remote..."
  git remote add shared-pg9 https://github.com/Phennecs/c360-privacy-center.git
fi

# This script takes master and copies it with no commit history, then pushes it to the c360 repo shared branch, first to staging, then production.
# In addition, for production, it changes the connect and pc add-on plans before committing/pushing.

git checkout master && \
git pull && \
(if [ $(git branch | egrep -q "^ *shared$"; echo $?) -eq 0 ]; then git branch -D shared; fi) && \
cd $(git rev-parse --show-toplevel) && \
git checkout --orphan shared && \
git add . && \
git commit -m "Sync repo" && \
git push --force shared-trial && \

git checkout master && \
git pull && \
(if [ $(git branch | egrep -q "^ *shared$"; echo $?) -eq 0 ]; then git branch -D shared; fi) && \
cd $(git rev-parse --show-toplevel) && \
git checkout --orphan shared && \
cat ./app.json | sed -e 's|"herokuconnect:test"|"herokuconnect:enterprise"|' -e 's|"privacycenter-staging:test"|"privacycenter:test"|' > ./app.json.new && \
mv ./app.json.new ./app.json && \
git add . && \
git commit -m "Sync repo" && \
git push --force shared && \

git checkout master && \
git pull && \
(if [ $(git branch | egrep -q "^ *shared$"; echo $?) -eq 0 ]; then git branch -D shared; fi) && \
cd $(git rev-parse --show-toplevel) && \
git checkout --orphan shared && \
cat ./app.json | sed -e 's|"herokuconnect:test"|"herokuconnect:enterprise"|' -e 's|"privacycenter-staging:test"|"privacycenter:test"|' -e 's|"heroku-postgresql:private-6"|"heroku-postgresql:private-9"|' > ./app.json.new && \
mv ./app.json.new ./app.json && \
git add . && \
git commit -m "Sync repo" && \
git push --force shared-pg9

rm -f ./app.json.new
git checkout $CURR_BRANCH