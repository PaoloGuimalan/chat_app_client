const {test}=require('node:test'); const assert=require('node:assert/strict');
const {load,state,reset,React,render,screen,act,cleanup,fireEvent}=require('./realm-management-fixture.cjs');
const Submissions=load('app/tabs/profile/user/SubmissionsContainer.tsx').default;
test('submissions render private read-only cards and discard data when acting identity changes',async()=>{
 reset(); assert.equal(typeof Submissions,'function'); const view=render(React.createElement(Submissions,{ownerEntityId:'owner'}));
 await act(async()=>state.calls.find(c=>c.method==='listAuthorSubmissions').resolve({results:[{post:{post_id:'p',caption:'private caption'},approval:2,decision:{reason:'Explain rejection',id:'d'}}],next:null}));
 assert.match(screen.getByText('Unapproved').textContent,/Unapproved/); assert.ok(screen.getByText('Explain rejection')); assert.equal(document.querySelector('article').dataset.readOnly,'true');
 state.actor='another'; view.rerender(React.createElement(Submissions,{ownerEntityId:'owner'})); assert.equal(screen.queryByText('private caption'),null); cleanup();
});
test('late submissions from an earlier account never populate the current list',async()=>{
 reset(); assert.equal(typeof Submissions,'function'); const view=render(React.createElement(Submissions,{ownerEntityId:'owner'})); const pending=state.calls[0];
 state.actor='page';view.rerender(React.createElement(Submissions,{ownerEntityId:'page'}));
 await act(async()=>pending.resolve({results:[{post:{post_id:'p',caption:'old secret'},approval:0}],next:null}));assert.equal(screen.queryByText('old secret'),null);cleanup();
});
