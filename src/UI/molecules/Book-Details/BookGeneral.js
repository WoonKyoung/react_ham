import EditBook from './Edit/EditBook';

function BookGeneral({ book, id }) {
  return (
    <>
      <h3>General</h3>
      <EditBook id={id} book={book} />
    </>
  );
}

export default BookGeneral;
