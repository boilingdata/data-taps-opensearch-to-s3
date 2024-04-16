# OpenSearch --> Data Taps --> S3 Parquet

This node application uses OpenSearch [sliced Scroll API](https://opensearch.org/docs/latest/search-plugins/searching-data/paginate/#scroll-search) with multiple [NodeJS worker threads](https://nodejs.org/api/worker_threads.html) to dump an index from an existing Elasticsearch/OpenSearch to S3 as Parquet files via an existing [Data Tap](https://github.com/boilingdata/data-taps-template).

You need to have [BoilingData account](https://github.com/boilingdata/boilingdata-bdcli) and use it to create a [Data Tap](https://github.com/boilingdata/data-taps-template).

1. Start local OpenSearch cluster.

```shell
yarn install
yarn up
```

2. Add test data. You can do it multiple times, each call adds 1m simple docs.

```shell
node src/addDocs.local.js
```

3. Dump the index into S3 via Data Tap.

```shell
time \
    INDEX=books \
    ES_USERNAME=admin \
    ES_PASSWORD=putYourPwHere \
    ES_HOST=localhost \
    ES_PORT=9200 \
    WORKERS=10 \
    BATCH_SIZE=2000 \
    BD_TAPURL=addYourTapUurl \
    BD_USERNAME=addYourBdUsername \
    BD_PASSWORD=addYourBdPassword \
    node src/index.js
```
