const functions = require('firebase-functions');
const cors = require('cors')({
  origin: true,
})
const MongoClient = require('mongodb').MongoClient;
const request = require('request-promise');
const url = "mongodb://" + functions.config().database.username + ":" + functions.config().database.password + "@ds111765.mlab.com:11765/stores";

const stores_load = async function () {
  const client = new MongoClient(url, { useNewUrlParser: true });
  await client.connect();
  const db = client.db('stores');
  const collection = db.collection('all_stores');
  let cursor = collection.find({});
  let stores = await cursor.toArray();
  client.close();
  return stores;
}

const scrap_data = async function (stores, product_id) {
  var return_array = [];

  var urls = new Array(stores.length);

  var reg = /RESERVE_AND_COLLECT.*?distance.{3}(\d+\.?\d*)/;

  for (var i = 0; i < stores.length; i++) {

    urls[i] = 'http://www.currys.co.uk/gb/uk/mcd_postcode_check/sProductId/'
      + product_id
      + '/sPostCode/'
      + stores[i]['Code']
      + '/latitude/'
      + stores[i]['Lat']
      + '/longitude/'
      + stores[i]['Lon']
      + '/ajax.html';
  }

  var promises = urls.map(url => request(url));

  await Promise.all(promises).then((data) => {
    var results;
    for (var i = 0; i < stores.length; i++) {
      if ((results = reg.exec(data[i])) !== null && results[1] < 2)
        return_array.push({ 'Country': stores[i]['Country'], 'Town': stores[i]['Town'], 'Lon': stores[i]['Lon'], 'Lat': stores[i]['Lat'] });
    }
  })

  return return_array;
}

exports.check = functions
  .region('europe-west1')
  .https
  .onRequest((req, res) => {
    return cors(req, res, async () => {
      let stores = await stores_load();
      let product_code = /\d{8}/.exec(req.path);

      if (product_code == null) {
        res.status(400).end();
        return;
      }

      let results = await scrap_data(stores, product_code[0]);
      res.status(200).send(results);
    });
  });

exports.coverage = functions
  .region('europe-west1')
  .https
  .onRequest((req, res) => {
    return cors(req, res, async () => {
      let stores = await stores_load();
      res.status(200).send(stores);
    })
  })