/*
 *
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
  credentials: [
    {
      name: "local",
      user: "jessetane",
      key: "~/.ssh/id_rsa"
    }
  ],
  services: [
    {
      name: "website",
      path: "services/website",
      scripts: "scripts"
    }, {
      name: "database",
      path: "services/database",
      scripts: "scripts"
    }
  ],
  environments: [
    {
      name: "development",
      variables: {
        WEBSITE_PORT: 3030,
        DATABASE_PORT: 3031,
        DATABASE_HOST: "localhost",
        DATABASE_DATA: "DEVELOPMENT-DATA"
      },
      hosts: [
        {
          name: "localhost",
          home: __dirname + "/environments/development",
          credential: "local"
        }
      ]
    }, {
      name: "production",
      variables: {
        WEBSITE_PORT: 8080,
        DATABASE_PORT: 8081,
        DATABASE_HOST: "db.host.com",
      },
      hosts: [
        {
          name: "web1.host.com",
          home: __dirname + "/environments/production/web1.host.com",
          credential: "local"
        }, {
          name: "web2.host.com",
          home: __dirname + "/environments/production/web2.host.com",
          credential: "local"
        }, {
          name: "web3.host.com",
          home: __dirname + "/environments/production/web3.host.com",
          credential: "local"
        }
      ]
    }, {
      name: "production.db",
      variables: {
        DATABASE_PORT: 8081,
        DATABASE_DATA: "PRODUCTION-DATA"
      },
      hosts: [
        {
          name: "db.host.com",
          home: __dirname + "/environments/production/db.host.com",
          credential: "local"
        }
      ]
    }
  ]
}
