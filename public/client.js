var button = document.getElementById('button');
button.addEventListener('click', onButtonClicked);
var loading = document.getElementById('loading');
loading.setAttribute('style', 'visibility:hidden')
var input = document.getElementById('input');
var container = document.getElementById('list_container');
container.setAttribute('style', 'visibility:hidden');

//map stuff
var map;
var markers = [];

function onButtonClicked() {
    var url = input.value;
    clear();
    container.setAttribute('style', 'visibility:hidden');

    if (url == 'cov') {
        input.classList.remove("is-invalid");
        testCov();
        return;
    }

    var product_code = /\d{8}/.exec(url);
    if (product_code == null) {
        input.classList.add("is-invalid");
        return;
    } else {
        input.classList.remove("is-invalid");
    }

    loading.setAttribute('style', 'visibility:true');
    jQuery.get("https://us-central1-stockfind-348c3.cloudfunctions.net/check/" + product_code, function (data) {
        loading.setAttribute('style', 'visibility:hidden');
        makeTables(data);
        draw(data);
    });
}

function testCov() {
    loading.setAttribute('style', 'visibility:true');
    jQuery.get("https://us-central1-stockfind-348c3.cloudfunctions.net/coverage", function (data) {
        loading.setAttribute('style', 'visibility:hidden');

        draw(data);
    });
}

function insertMap() {
    L.mapbox.accessToken = 'pk.eyJ1IjoiYWNhMThtaiIsImEiOiJjanU5eGs5NXcwbnhrNDBwZGw3MmxrdmwxIn0.eu-FlYkpu7WHxL1W45XEwg';

    map = L.mapbox.map('map')
        .setView([53.8603, -2.3741], 5.4)
        .addLayer(L.mapbox.styleLayer('mapbox://styles/mapbox/streets-v11'));
}

function clear() {
    for (var i = 0; i < markers.length; i++) {
        map.removeLayer(markers[i]);
    }
    markers = [];

    $(document.getElementById('england_container')).html("");
    $(document.getElementById('scotland_container')).html("");
    $(document.getElementById('wales_container')).html("");
    $(document.getElementById('nir_container')).html("");
}

function draw(data) {
    for (var i = 0; i < data.length; i++) {

        var marker = L.marker([data[i]['Lat'], data[i]['Lon']], {
            icon: L.mapbox.marker.icon({
                'marker-color': '#f86767'
            })
        }).addTo(map);

        markers.push(marker);
    }
}

function makeTables(data) {
    container.setAttribute('style', 'visibility:true');

    var england_container = document.getElementById('england_container');
    var scotland_container = document.getElementById('scotland_container');
    var wales_container = document.getElementById('wales_container');
    var nir_container = document.getElementById('nir_container');

    for (var i = 0; i < data.length; i++) {

        var newLi = document.createElement('li');
        newLi.classList.add('list-group-item');
        newLi.appendChild(document.createTextNode(data[i]['Town']));

        switch (data[i]['Country']) {
            case ('England'):
                england_container.appendChild(newLi);
                break;
            case ('Scotland'):
                scotland_container.appendChild(newLi);
                break;
            case ('Wales'):
                wales_container.appendChild(newLi);
                break;
            case ('Northern Ireland'):
                nir_container.appendChild(newLi);
                break;
            default:
                console.log(data[i]['Country']);
                break;
        }
    }

}

insertMap();
