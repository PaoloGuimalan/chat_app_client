import { Fragment } from "react";

function Line({ width = "100%", height = 12 }: { width?: string; height?: number }) {
  return <span className="writing-skeleton-line" style={{ width, height }}/>;
}

export function NoteCardSkeleton({ id, index, tile }: {
  id: string;
  index: number;
  tile?: { left: number; top: number; width: number };
}) {
  return <article className="note-card writing-note-skeleton" data-note-skeleton={id} aria-hidden="true"
    style={{ left: tile?.left, top: tile?.top, width: tile?.width, visibility: tile ? "visible" : "hidden" }}>
      <div className="note-card-open"><Line width="76%" height={17}/><div className="writing-skeleton-body">{Array.from({ length: 3 + index % 3 }, (_, line) => <Line key={line} width={line === 2 + index % 3 ? "61%" : "96%"}/>)}</div></div>
      <footer className="note-card-footer"><Line width="42px" height={10}/><Line width="24px" height={16}/></footer>
    </article>;
}

export function DiaryListSkeleton() {
  return <div role="status" aria-label="Loading diary entries">
    {Array.from({ length: 3 }, (_, group) => <Fragment key={group}>
      <div className="diary-date-group" aria-hidden="true"><Line width="112px" height={13}/></div>
      {Array.from({ length: group === 0 ? 2 : 1 }, (_, card) => <div className="diary-row writing-diary-skeleton" key={card} aria-hidden="true">
        <div className="diary-row-title"><Line width="59%" height={17}/><Line width="27%" height={12}/></div>
        <div className="writing-tags"><Line width="48px" height={21}/><Line width="57px" height={21}/></div>
        <div className="writing-skeleton-body"><Line width="96%"/><Line width="72%"/></div>
        <div className="diary-row-meta"><Line width="53px" height={12}/><span style={{ marginLeft: "auto" }}><Line width="43px" height={11}/></span></div>
      </div>)}
    </Fragment>)}
  </div>;
}

export function DiaryEntrySkeleton() {
  return <><div className="writing-document-scroll" role="status" aria-label="Loading diary entry">
    <article className="writing-document writing-entry-skeleton" aria-hidden="true">
      <div className="writing-document-title"><Line width="72%" height={29}/></div>
      <div className="writing-meta"><Line width="155px" height={13}/></div>
      <div className="diary-mood"><Line width="24px" height={24}/><Line width="160px" height={13}/></div>
      {Array.from({ length: 3 }, (_, paragraph) => <div className="writing-skeleton-body" key={paragraph}>
        {Array.from({ length: paragraph === 1 ? 3 : 4 }, (_, line) => <Line key={line} width={line === 3 || paragraph === 1 && line === 2 ? "66%" : "96%"}/>)}</div>)}
    </article>
  </div><footer className="writing-footer" aria-hidden="true"><Line width="70px" height={11}/><Line width="45px" height={11}/></footer></>;
}
