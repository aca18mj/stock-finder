const functions = require('firebase-functions');
const cors = require('cors')({
  origin: true,
})

const MongoClient = require('mongodb').MongoClient;
const request = require('request-promise');

const url = "mongodb+srv://" + functions.config().database.username + ":" + functions.config().database.password + "@cluster0.ra2cd.mongodb.net/stockfinder?retryWrites=true&w=majority"


const stores_load = async function () {
  const client = new MongoClient(url, { useNewUrlParser: true });
  await client.connect();

  const collection = client.db("stockfinder").collection("stores");
  let cursor = collection.find({});
  let stores = await cursor.toArray();
  client.close();

  return stores;
}

const scrap_data = async function (stores, product_id) {
  var return_array = [];

  var urls = new Array(stores.length);

  var reg = /success.*?PAY_AND_COLLECT.*?0\smile\saway/;

  for (var i = 0; i < stores.length; i++) {

    urls[i] = 'https://www.currys.co.uk/gb/uk/mcd_postcode_check/sProductId/'
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
      if (reg.test(data[i]))
        return_array.push({ 'Country': stores[i]['Country'], 'Town': stores[i]['Town'], 'Lon': stores[i]['Lon'], 'Lat': stores[i]['Lat'] });
    }
  }).catch((e) => {
    console.log(e);
    throw 'Curry\'s server not responding'
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
        res.status(400).end('Invalid input');
        return;
      }

      try {
      let results = await scrap_data(stores, product_code[0]);
      res.status(200).send(results);
      } catch (e) {
        res.status(500).send(e);
      }
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


exports.testing = functions
  .region('europe-west1')
  .https
  .onRequest((req, res) => {
    let url = "https://www.currys.co.uk/gb/uk/mcd_postcode_check/sProductId/10193334/sPostCode/S37LG/latitude/53.387707/longitude/-1.479336/ajax.html"
    request(url)
      .then((data) => {
        res.status(200).send(data)
      })
  })