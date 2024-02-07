import '../../../styles/styles.css'
import CallWindow from './CallWindow'
import { useSelector } from 'react-redux'

function CallCollection() {

  const callslist = useSelector((state: any) => state.callslist);

  return (
    <div id='div_callcollection'>
        {callslist.map((cls: any, i: number) => {
          return(
            <CallWindow key={cls.conversationID} data={cls} lineNum={i} />
          )
        })}
    </div>
  )
}

export default CallCollection