# Feature Flag Events Demo

This application is a proof of concept that demonstrate how an application using OpenFeature and OpenTelemetry can be leveraged for observability.

## Getting started

### Prereqs

- Node.js v20 or newer
- Docker (for running the load generator)

### Starting the app (if not using docker-compose)

1. clone the repo
2. run `npm install`
3. Create a `.env` file in the root of the project. You can use the `.env.template` as an example.
4. run `npm run start`

### Run the load generator

1. run `docker run --network="host" --rm -i grafana/k6 run - <./load-generation/requests-from-tenants.js`