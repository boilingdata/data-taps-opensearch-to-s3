# OpenSearch or ES --> Data Tap --> S3 Parquet

> "The same data costs 70-100x more on a highly available (HA) OpenSearch cluster with EBS Volumes vs. S3 with compressed Parquet files!"

This multi-threaded node application uses OpenSearch (Elasticsearch) [sliced Scroll API](https://opensearch.org/docs/latest/search-plugins/searching-data/paginate/#scroll-search) to efficiently dump an index to S3 via a [Data Tap](https://github.com/boilingdata/data-taps-template). A Data Tap is a single AWS Lambda function with Function URL and customized C++ runtime embedding DuckDB. It uses streaming SQL clause to upload the HTTP POSTed newline JSON data to S3, hive partitioned, and as ZSTD compressed Parquet. You can tune the SQL clause your self for filtering, aggregations etc.

You need to have [BoilingData account](https://github.com/boilingdata/boilingdata-bdcli) and use it to create a [Data Tap](https://github.com/boilingdata/data-taps-template).

1. (optional) Start local OpenSearch cluster and add test data

Each call adds 1m small docs via the Bulk API. You can run it multiple times to get more data. The data is dummy, the same single entry.

```shell
yarn up
time \
    INDEX=books \
    ES_USERNAME=admin \
    ES_PASSWORD=putYourPwHere \
    ES_HOST=localhost \
    ES_PORT=9200 \
    node src/addDocs.local.js
```

2. Dump OpenSearch index into S3 as Parquet files via a Data Tap.

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

Clipped output showing network capped results (i.e. utilising full capacity of home broadband uplink).

```javascript
{ totalCount: 2186008 }
{ id: 1, p: '0%', bytes: 318918 }
{ id: 7, p: '0%', bytes: 318913 }
{ id: 1, p: '1.84%', bytes: 318918 }
{ id: 7, p: '1.84%', bytes: 318913 }
{ id: 9, p: '0%', bytes: 318876 }
{ id: 2, p: '0%', bytes: 318841 }
{ id: 9, p: '1.83%', bytes: 318876 }
{ id: 8, p: '0%', bytes: 318902 }
{ id: 2, p: '1.83%', bytes: 318841 }
{ id: 8, p: '1.82%', bytes: 318902 }
{ id: 3, p: '0%', bytes: 318836 }
{ id: 5, p: '0%', bytes: 318886 }
{ id: 3, p: '1.83%', bytes: 318836 }
{ id: 5, p: '1.83%', bytes: 318886 }
{ id: 6, p: '0%', bytes: 318826 }
{ id: 10, p: '0%', bytes: 318970 }
...
{ id: 4, p: '100.00%', bytes: 37753617 }
{ id: 9, p: '99.98%', bytes: 37401533 }
{ id: 4, p: '100.00%', bytes: 37930929 }
{ id: 9, p: '100.00%', bytes: 37750612 }
{ id: 9, p: '100.00%', bytes: 37757436 }
{
  sentCount: 2186008,
  totalCount: 2186008,
  sentMBytes: '361.05',
  throughput: '8.18'
}
✨  Done in 44.52s.
```
