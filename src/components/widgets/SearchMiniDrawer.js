import React from 'react'
import { motion } from 'framer-motion'
import '../../styles/widgets/index.css'

function SearchMiniDrawer({searchbox}) {
  return (
    <div id='div_searchminidrawer'>
        <div id='div_searchminidrawer_header'>
            <span id='span_searchminidrawer_label'>Searching for "{searchbox}"</span>
        </div>
        <div id='div_searchminidrawer_content'></div>
    </div>
  )
}

export default SearchMiniDrawer