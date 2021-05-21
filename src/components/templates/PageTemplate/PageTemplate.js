import React from 'react';
import classNames from 'classnames';
import store from '../../../stores/store';
import { observer } from 'mobx-react';
import './PageTemplate.scss';

export const PageTemplate = observer(({header, menu, children, footer, notFound, leftMenu}) => {
    
    return (
        <div className="page_template">
            {header}
            <div className="body">
                {menu}
                <div className={classNames('body_content', {'body_content_100' : notFound})} style={leftMenu ? {width: 'calc(100% - 210px)'} : {width: '100%'}}>
                    <p className="body_content_title">
                        {store.openedPage !== null && store.openedPage}
                    </p>
                    <div className="body_content_area">
                       
                        {children}
                    </div>
                    {footer}
                </div>
            </div>
        </div>
    );
});