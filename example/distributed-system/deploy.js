/*
 *  deploy.js - config
 *

# add these to your hosts file
127.0.0.1 db.staging.host.com
127.0.0.1 web.staging.host.com
127.0.0.1 db.host.com
127.0.0.1 web1.host.com
127.0.0.1 web2.host.com
127.0.0.1 web3.host.com

 */

module.exports = {
  credentials: {
    "local": {
      user: "jessetane",
      key: "~/.ssh/id_rsa"
    }
  },
  services: {
    "website": {
      path: "services/website",
      scripts: "scripts"
    },
    "database": {
      path: "services/database",
      scripts: "scripts"
    }
  },
  environments: {
    "development": {
      variables: {
        WEBSITE_PORT: 3030,
        DATABASE_PORT: 3031,
        DATABASE_HOST: "localhost",
        DATABASE_DATA: "DEVELOPMENT-DATA"
      },
      hosts: {
        "localhost": {
          home: __dirname + "/environments/development",
          credential: "local",
          services: [
            "website",
            "database"
          ]
        }
      }
    }, 
    "production": {
      variables: {
        WEBSITE_PORT: 8080,
        DATABASE_PORT: 8081,
        DATABASE_HOST: "db.host.com",
      },
      hosts: {
        "web1.host.com": {
          home: __dirname + "/environments/production/web1.host.com",
          credential: "local",
          variables: { WEBSITE_PORT: 8082 },
          services: [ "website" ]
        },
        "web2.host.com": {
          home: __dirname + "/environments/production/web2.host.com",
          credential: "local",
          variables: { WEBSITE_PORT: 8083 },
          services: [ "website" ]
        },
        "web3.host.com": {
          home: __dirname + "/environments/production/web3.host.com",
          credential: "local",
          variables: { WEBSITE_PORT: 8084 },
          services: [ "website" ]
        },
        "db.host.com": {
          home: __dirname + "/environments/production/db.host.com",
          credential: "local",
          variables: { DATABASE_DATA: "little data" },
          services: [ "database" ]
        }
      }
    }
  }
}
