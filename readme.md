### Assumption
Knowing that the database is huge, I assume that the transactions table has an index by date.


### Description
This system is horizontally scalable because it can handle an increasing number of requests when creating new instances behind a load balancer. These instances are configured to fetch user percentiles to a cache. In this case, I used redis, because it acts as a fast key-value database.

This system is divided into two parts:
 - a **command** that will search the transactions table for the date. It then calculates the percentiles and writes to the cache.
 - a **public API** where data is returned almost instantly to the user because it fetches the percentiles from the cache.


### Install dependencies
`npm i`

### Run command to populate cache
`npm run calculate-spending-rank -- --from='2020-07-18' --to='2020-07-28'`


### Run public API in development mode
`zen dev`


### .env example
###### Api
PORT=3000

###### Database
DB_HOST=0.0.0.0

DB_PORT=3306

DB_USERNAME=root

DB_PASSWORD=root

DB_NAME=my_app_db

###### Cache
REDIS_HOST=0.0.0.0

REDIS_PORT=6379

REDIS_PASSWORD=''
