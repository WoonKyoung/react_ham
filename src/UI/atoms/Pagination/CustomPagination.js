import React, { useState, useEffect } from 'react'
import Pagination from 'react-js-pagination';
import './CustomPagination.scss';

export const CustomPagination = (props) => {

    const [currentPage, setCurrentPage] = useState(props.activePage+1);

    useEffect(() => {
        setCurrentPage(props.activePage+1);
    }, [props.activePage])
    
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        props.onChange(pageNumber);
    }

    return (
        <Pagination 
            activePage={currentPage}
            itemsCountPerPage={props.itemsCountPerPage}
            totalItemsCount={props.totalItemsCount}
            pageRangeDisplayed={props.pageRange}
            linkClassFirst="first"
            linkClassPrev="prev"
            linkClassNext="next"
            linkClassLast="last"
            onChange={(pageNumber) => handlePageChange(pageNumber)}
        />
    )
}
