import React, {useEffect, useState} from 'react';
import '../css/MapFeed.css';
import { GoogleMap, withScriptjs, withGoogleMap, Marker, InfoWindow } from 'react-google-maps'
import { useSelector } from 'react-redux';
import { Axios } from 'axios';
import imgpers from '../../imgs/person-icon.png';
import Like from '@material-ui/icons/ThumbUp';
import Comment from '@material-ui/icons/Comment';
import Share from '@material-ui/icons/Reply';


function MapContainer(){

    // console.log(coordss);

    const coordsvals = useSelector(state => state.coordsval);
    const feeds = useSelector(state => state.feeds);

    return(
        <GoogleMap defaultZoom={15} defaultCenter={{ lat: coordsvals[0], lng: coordsvals[1] }}>
        {feeds.map(dts => (
            <InfoWindow
                key={dts.post_id}
                position={{
                    lat: dts.coordinates[0],
                    lng: dts.coordinates[1]
                }}
             >
                 <div className='mapfeed_posts'>
                    <table className='tbl_posts_feed' key={dts.post_id}>
                        <tbody>
                            <tr>
                                <td className='img_handlertd'>
                                <table>
                                    <tbody>
                                    <tr>
                                        <td>
                                        <img  id='img_handlerfeed' src={imgpers} />
                                        </td>
                                        <td className='td_det_user'>
                                        <span id='feed_username'>{dts.username}</span>
                                        <br />
                                        <span id='feed_date'>{dts.date}</span>
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                <p id='feed_post'>{dts.feed}</p>
                                </td>
                            </tr>
                            <tr>
                                <td><hr className='hr_styles' /></td>
                            </tr>
                            <tr>
                                <td>
                                <ul>
                                    <li className='li_feed'><Like /></li>
                                    <li className='li_feed'><Comment /></li>
                                    <li className='li_feed'><Share /></li>
                                </ul>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
             </InfoWindow>
        ))}
        </GoogleMap>
    )
}

const WrapMap = withScriptjs(withGoogleMap(MapContainer));

function MapFeed() {

    // console.log(coordss)

  return(
    <div id='mapfeed_div'>
        <WrapMap 
        googleMapURL={`https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places&key=AIzaSyCDArcKqr23dDqa-vHJth47boNsITmBB78`}
        loadingElement={<div style={{height: '100%'}} />}
        containerElement={<div style={{height: '100%'}} />}
        mapElement={<div style={{height: '100%'}} />}
         />
    </div>
  );
}

export default MapFeed;
