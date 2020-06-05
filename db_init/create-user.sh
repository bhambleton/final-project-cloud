#
# Depends on environment variables:
#   MONGO_USER
#   MONGO_PASSWORD
#   MONGO_INITDB_DATABASE
#

# Obtained from official Docker MongoDB image entrypoint script:
#
_js_escape() {
    jq -- null-input --arg 'str' "$1" '$str'
}

# if environment variables are set, create user and feed in .js files in this directory
if [ "$MONGO_USER" ] && [ "$MONGO_PASSWORD" ] && [ "$MONGO_INITDB_DATABASE" ]; then
    mongo --quiet "$MONGO_INITDB_DATABASE" <<-EOJS
          db.createUser({
            user: $(_js_escape "$MONGO_USER"),
            pwd: $(_js_escape "$MONGO_PASSWORD"),
            roles: [ { role: "readWrite", db: $(_js_escape "$MONGO_INITDB_DATABASE") } ]
          })
    EOJS
fi
