import React from 'react';
import { createStore } from "redux";
import * as redux from 'react-redux';
import { BrowserRouter as Router } from "react-router-dom";
import { shallow, mount, render } from "enzyme";
import '@testing-library/jest-dom/extend-expect'
import Navbar from "./Navbar";
import { USER_CHANGE_FAIL, USER_CHANGE_REQUEST, USER_CHANGE_SUCCESS } from '../../../constants/userConstants';
import Footer from '../../Footer';

const userChange = {
    userRole: {
        "authClio": true,
        "authIntuit": true,
        "updated_at": "2022-02-06T20:30:01.000Z",
        "company_profile_pic": "https://cloudact-image.s3.ca-central-1.amazonaws.com/1642621125101.png",
        "short_firmname": "RPDV",
        "display_firmname": "Rodrigues Paiva LLP",
        "sid": 1,
        "role": "ADMIN",
        "region": "us",
        "province": "ON"
    }, loading: false
};

const reducer = (state = { userChange }, action) => {
    switch (action.type) {
        case USER_CHANGE_REQUEST:
            return { loading: true };

        case USER_CHANGE_SUCCESS:
            return { loading: false, userRole: action.payload };

        case USER_CHANGE_FAIL:
            return { loading: false, userRole: "Cannot change user" };

        default:
            return state;
    }
}

const store = createStore(reducer, userChange);

it('renders with redux', () => {
    const spy = jest.spyOn(redux, 'useSelector');
    spy.mockReturnValue({ userRole: userChange.userRole })
    const findNavbar = shallow(<Navbar />)
    expect(findNavbar.find('[id="reports_link"]').find('[id="reports"]').length).toEqual(1);
    console.log(findNavbar.find('[id="reports_link"]').find('[id="reports"]').debug())
    expect.assertions(1);
})