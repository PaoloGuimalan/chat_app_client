import { useEffect } from 'react';
import { Map as MapGL } from 'maplibre-gl';

function MapFeed() {

  useEffect(() => {

    // window.locationiq.key = "pk.f9b59be5e6653ab04296d123446a4564"

    var map = new MapGL({
        // style: `https://api.maptiler.com/maps/basic-v2/style.json?key=AqtwgEiGiqzjVxuM07x4`,
        style: `https://api.maptiler.com/maps/basic-v2-dark/style.json?key=AqtwgEiGiqzjVxuM07x4`,
        container: 'div_mapgl',
        // style: window.locationiq.getLayer("Streets"),
        zoom: 15,
        center: [120.9842, 14.5995],
        pitch: 45,
        bearing: -17.6,
        antialias: true
    });
    
    //Define layers you want to add to the layer controls; the first element will be the default layer
    // var layerStyles = {
    //     "Streets": "streets/vector",
    //     "Dark": "dark/vector",
    //     "Light": "light/vector"
    // };
    
    // map.addControl(new window.locationiqLayerControl({
    //     key: window.locationiq.key,
    //     layerStyles: layerStyles
    // }), 'top-left');

    map.on('load', () => {
        // Insert the layer beneath any symbol layer.
        const layers: any = map.getStyle().layers;
  
        let labelLayerId;
        for (let i = 0; i < layers.length; i++) {
            if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
                labelLayerId = layers[i].id;
                break;
            }
        }
  
        map.addSource('openmaptiles', {
            url: `https://api.maptiler.com/tiles/v3/tiles.json?key=AqtwgEiGiqzjVxuM07x4`,
            type: 'vector',
        });
  
        map.addLayer(
            {
                'id': '3d-buildings',
                'source': 'openmaptiles',
                'source-layer': 'building',
                'type': 'fill-extrusion',
                'minzoom': 15,
                'paint': {
                    'fill-extrusion-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'render_height'], 0, 'gray', 200, '#4d4d4d', 400, 'lightblue'
                    ],
                    'fill-extrusion-height': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        15,
                        0,
                        16,
                        ['get', 'render_height']
                    ],
                    'fill-extrusion-base': ['case',
                        ['>=', ['get', 'zoom'], 16],
                        ['get', 'render_min_height'], 0
                    ]
                }
            },
            labelLayerId
        );
    });
  },[])  

  return (
    <div id='div_mapgl' className="tw-bg-[#4d4d4d] tw-w-full tw-absolute tw-h-full tw-overflow-y-hidden"></div>
  )
}

export default MapFeed