# #!/bin/bash
# if [ $# -lt 1 ]; then
#   echo "Usage: $0 EXPRESS_PORT [JSON_PAYLOAD]"
#   exit 2
# fi
# PORT=$1
# # PAYLOAD='{ \"accessToken\": \"myAccessToken!\" }'
# PAYLOAD_FILE=./token.json
# if [ $# -gt 1 ]; then
#   PAYLOAD_FILE="$2"
# fi

# if [ ! -r $PAYLOAD_FILE ]; then
#   echo "File: $PAYLOAD_FILE was not readable or did not exist."
#   exit 9
# fi

# URL="http://localhost:$PORT/setAccessToken"
# echo "Sending POST to $URL"
# echo curl -v -X POST --trace-ascii /dev/stdout -H \"Accept: application/json\" -H \"Content-Type: application/json\" -d '{ "access_token": "myAccessToken" }' $URL
# set -x
# curl -v -X POST -H "Accept: application/json" -H "Content-Type: application/json" -d '{"access_token":"myAccessToken"}' $URL
# CURLRC=$?
# set +x
# echo "curl RC=$CURLRC"