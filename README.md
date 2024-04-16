# Dump OpenSearch index to S3 via Data Taps

This node application uses Scroll API with multiple worker threads to read an index from Elasticsearch/OpenSearch and send it in batches to a Data Tap. The Data Tap uploads the data as Parquet into S3.

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
time WORKERS=10 BATCH_SIZE=2000 BD_TAPURL=addYourTapUurl BD_USERNAME=addYourBdUsername BD_PASSWORD=addYourBdPassword yarn test
```
