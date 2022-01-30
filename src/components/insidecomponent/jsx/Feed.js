import React from 'react';
import '../css/Feed.css';
import imgPerson from '../../imgs/person-icon.png';
import Submit from '@material-ui/icons/Check';
import Cancel from '@material-ui/icons/CancelOutlined';

function Feed() {
  return (
    <div id='div_feed'>
        <div id='post_nav'>
            <table id='tbl_post'>
              <tbody>
                <tr>
                  <td>
                    <img src={imgPerson} id='img_handler'/>
                  </td>
                  <td id='txt_area_td'>
                    <textarea id='post_area'></textarea>
                  </td>
                  <td>
                    <table>
                      <tbody>
                        <tr>
                          <td>
                              <button className='btns_post'><Submit /></button>
                          </td>
                        </tr>
                        <tr>
                          <td>
                              <button className='btns_post'><Cancel /></button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
        </div>
    </div>
  );
}

export default Feed;
