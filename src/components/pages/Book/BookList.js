import React , { useState, useEffect } from "react";
import firebase from "firebase/app";
import AddBook from "../../../UI/molecules/Book/AddBook";
import {Loading} from "../../../UI/atoms";
import BookItem from "../../../UI/molecules/Book/BookItem";

function BookList() {
  const [books, setBooks] = useState([]);

  // useEffect(() => {
  //   const db = firebase.firestore();
  //
  //   (async () => {
  //     const snapshot = await db.collection("books").get();
  //     const booksArray = [];
  //     snapshot.forEach((doc) => {
  //       booksArray.push({
  //         id: doc.id,
  //         ...doc.data(),
  //       });
  //     });
  //     setBooks(booksArray);
  //   })();
  // }, []);

  return (
    <div className="book-list">
      <AddBook />
      <h2>Book list</h2>
      {!books.length ? <Loading /> : books.map((book) => (
        <BookItem book={book} key={book.id} />
      ))}
    </div>
  );
}

export default BookList;