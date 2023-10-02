import React from 'react'
import '../../../styles/absolutes/index.css'
import CallWindow from './CallWindow'
import { useSelector } from 'react-redux'

function CallCollection() {

  const callslist = useSelector(state => state.callslist);

  return (
    <div id='div_callcollection'>
        {callslist.map((cls, i) => {
          return(
            <CallWindow key={cls.conversationID} data={cls} lineNum={i} />
          )
        })}
    </div>
  )
}

export default CallCollection