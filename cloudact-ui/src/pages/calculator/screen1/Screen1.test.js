import React from 'react'
import { shallow } from 'enzyme';
import Screen1 from './Screen1.tsx';
import App from '../../../App'
import { momentFunction } from '../../../utils/moment';

// it('shows the background component for both the parties', () => {
//     const wrapped = shallow(<Screen1 />);
//     console.log("wrapped", wrapped);

//     expect(wrapped.find(Screen1).length).toEqual(1);
// })

it('validates date', () => {
    const result = momentFunction.validateDate('29/05/2020');

    expect(result).toBe(true)

})
