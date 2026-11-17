const {test}=require('node:test'); const assert=require('node:assert/strict');
const {load,state,reset,React,render,screen,act,cleanup}=require('./realm-management-fixture.cjs');
const Detail=load('app/tabs/moderation/CommunityReviewDetail.tsx',{'react-router-dom':{useParams:()=>({decisionId:'decision'})}}).default;
test('human community decisions show the reason and current-content disclaimer without classifier scores',async()=>{
 reset();assert.equal(typeof Detail,'function');render(React.createElement(Detail));
 await act(async()=>state.calls[0].resolve({decision:{action:'takedown',reason:'Off topic',created_at:'2026-11-17T01:00:00Z'},matches_reviewed_version:false,content:{post_id:'p',caption:'retained content'}}));
 assert.ok(screen.getByText('Off topic'));assert.ok(screen.getByText(/current retained content/i));assert.equal(screen.queryByText(/classifier|confidence|score/i),null);
 assert.equal(screen.getByText('retained content').parentElement.tagName,'DIV','the retained post reuses the themed Card surface');cleanup();
});
