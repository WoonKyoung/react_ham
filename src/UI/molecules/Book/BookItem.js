import React from 'react';
import {Link} from 'react-router-dom'

function BookItem({ book }) {
  return (
    <div className="book-item">
      <h4><Link to={`/book/${book.id}`}>{book.title}</Link></h4>
      <span>
        <strong>Pages: </strong> {book.pages}
      </span>{" "}
      <span>
        <strong>Publishing Date: </strong>{" "}
        {new Date(book.publishDate).toDateString()}
      </span>
    </div>
  );
}

export default BookItem;
