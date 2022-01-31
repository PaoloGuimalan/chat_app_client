import React from 'react';
import '../css/Feed.css';
import imgPerson from '../../imgs/person-icon.png';
import Submit from '@material-ui/icons/Check';
import Cancel from '@material-ui/icons/CancelOutlined';
import Forum from '@material-ui/icons/ForumRounded';

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
                    <textarea id='post_area' placeholder='Write Something...'></textarea>
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
        <div id='feed_place'>
          <table className='tbl_posts_feed'>
            <tbody>
              <tr>
                <td>
                  <Forum id='logo_post' />
                </td>
              </tr>
              <tr>
                <td>
                  <p id='label_no_post'>No Posts Yet.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
    </div>
  );
}

export default Feed;
