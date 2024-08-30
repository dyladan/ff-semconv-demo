# Feature Flag Events Demo

> [!CAUTION]
> NOT FOR PRODUCTION USE. ALL SEMCONV IS EXPERIMENTAL. REFER TO OPENTELEMETRY SEMCONV FOR LATEST STATE.

## Demo app

### Run the app

- Build the app container `docker-compose build`
- Run the app `docker-compose up`

### Scenarios

TODO: add flag definitions and descriptions 

### Run the load generator

`docker run --network="host" --rm -i grafana/k6 run - <./load-generation/requests-from-tenants.js`
