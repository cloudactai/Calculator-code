// import { calculateAge } from "../../../matterValidations/matterValidation";

// StaticFields.js
const StaticFields = (documentData, formType) => {
  let staticFields = [];

  if (formType === 'Form8') {
    staticFields = [
      {
        "id": "fast_track",
        "type": "CheckBox",
        "x": 20,
        "y": 539,
        "width": "20",
        "height": "20",
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": "normal_track",
        "type": "CheckBox",
        "x": 20,
        "y": 571,
        "width": "20",
        "height": "20",
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": "first_courtDate-am",
        "type": "CheckBox",
        "x": 490,
        "y": 424,
        "width": "20",
        "height": "20",
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": "first_courtDate-pm",
        "type": "CheckBox",
        "x": 543,
        "y": 424,
        "width": "20",
        "height": "20",
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 7,
        "type": "CheckBox",
        "x": 20,
        "y": 424,
        "width": "20",
        "height": "20",
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": "id-1727771329466-7",
        "type": "TextField",
        "x": 435.6666666666667,
        "y": 70.33333333333333,
        "width": 150,
        "height": 20,
        "value": "court_info.courtFileNumber",
        "fontSize": 9,
        "border": "none",
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "page": 1,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": "id-1727471819827-157",
        "type": "TextField",
        "x": 159.66666666666666,
        "y": 70.33333333333333,
        "width": 396,
        "height": 20,
        "value": "court_info.courtName",
        "fontSize": 9,
        "border": "none",
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "page": 1,
        "bind": "court_info.courtName"
      },
      {
        "id": 1727474172673,
        "type": "TextArea",
        "x": 20,
        "y": 198,
        "width": 413,
        "height": 38,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727474188181,
        "type": "TextArea",
        "x": 316.6666666666667,
        "y": 198.66666666666666,
        "width": 410,
        "height": 34,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727474211857,
        "type": "TextArea",
        "x": 315.6666666666667,
        "y": 224,
        "width": 414,
        "height": 35,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727474220557,
        "type": "TextArea",
        "x": 17,
        "y": 294,
        "width": 419,
        "height": 36,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727474378849,
        "type": "TextArea",
        "x": 315,
        "y": 294,
        "width": 417,
        "height": 36,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727474386264,
        "type": "TextArea",
        "x": 18,
        "y": 320,
        "width": 417,
        "height": 36,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727474392639,
        "type": "TextArea",
        "x": 316,
        "y": 319.3333333333333,
        "width": 417,
        "height": 37,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727474400839,
        "type": "TextField",
        "x": 206.66666666666666,
        "y": 423,
        "width": 213,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727474407366,
        "type": "TextField",
        "x": 368,
        "y": 422.3333333333333,
        "width": 177,
        "height": 21,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727474488155,
        "type": "TextField",
        "x": 158,
        "y": 101,
        "width": 396,
        "height": 20,
        "value": "court_info.courtOfficeAddress",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtOfficeAddress"
      },
      {
        "id": "first_courtDate.address_1",
        "type": "TextField",
        "x": 19.333333333333332,
        "y": 484.6666666666667,
        "width": 859,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "border": "none",
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "page": 1
      },
      {
        "id": "first_courtDate.address_2",
        "type": "TextField",
        "x": 19.333333333333332,
        "y": 465.6666666666667,
        "width": 858,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "border": "none",
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "page": 1
      },
      {
        "id": "id-1727471819827-622",
        "type": "TextField",
        "x": 432.3333333333333,
        "y": 31,
        "width": 160,
        "height": 20,
        "value": "court_info.courtFileNumber",
        "fontSize": 9,
        "border": "none",
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "page": 2
      },
      {
        "id": "id-1727471819827-932",
        "value": "court_info.courtFileNumber",
        "width": 160,
        "height": 20,
        "x": 431.6666666666667,
        "y": 31,
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "type": "TextField"
      },
      {
        "id": "id-1727471819827-327",
        "value": "court_info.courtFileNumber",
        "width": 160,
        "height": 20,
        "x": 432.3333333333333,
        "y": 30.333333333333332,
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4,
        "type": "TextField"
      },
      {
        "id": "id-1727471819827-831",
        "value": "court_info.courtFileNumber",
        "width": 160,
        "height": 20,
        "x": 432.3333333333333,
        "y": 31,
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "type": "TextField"
      },
      {
        "id": 1727779155036,
        "type": "TextField",
        "x": 32.666666666666664,
        "y": 403.3333333333333,
        "width": 389,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 26,
        "type": "CheckBox",
        "x": 20,
        "y": 94,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 27,
        "type": "CheckBox",
        "x": 20,
        "y": 138,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 28,
        "type": "CheckBox",
        "x": 37,
        "y": 171,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 29,
        "type": "CheckBox",
        "x": 37,
        "y": 189,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 30,
        "type": "CheckBox",
        "x": 37,
        "y": 208,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 31,
        "type": "CheckBox",
        "x": 37,
        "y": 236,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 32,
        "type": "CheckBox",
        "x": 37,
        "y": 264,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 33,
        "type": "CheckBox",
        "x": 37,
        "y": 283,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 34,
        "type": "CheckBox",
        "x": 224,
        "y": 171,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 35,
        "type": "CheckBox",
        "x": 224,
        "y": 189,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 36,
        "type": "CheckBox",
        "x": 224,
        "y": 218,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 37,
        "type": "CheckBox",
        "x": 224,
        "y": 247,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 38,
        "type": "CheckBox",
        "x": 224,
        "y": 265,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 39,
        "type": "CheckBox",
        "x": 224,
        "y": 283,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 40,
        "type": "CheckBox",
        "x": 224,
        "y": 312,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 41,
        "type": "CheckBox",
        "x": 224,
        "y": 330,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 42,
        "type": "CheckBox",
        "x": 224,
        "y": 348,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 43,
        "type": "CheckBox",
        "x": 411,
        "y": 172,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 44,
        "type": "CheckBox",
        "x": 411,
        "y": 200,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 45,
        "type": "CheckBox",
        "x": 411,
        "y": 229,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 46,
        "type": "CheckBox",
        "x": 411,
        "y": 269,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 47,
        "type": "CheckBox",
        "x": 411,
        "y": 287,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 48,
        "type": "CheckBox",
        "x": 225,
        "y": 377,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 49,
        "type": "CheckBox",
        "x": 37,
        "y": 396,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 50,
        "type": "CheckBox",
        "x": 37,
        "y": 415,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 51,
        "type": "CheckBox",
        "x": 37,
        "y": 432,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 52,
        "type": "CheckBox",
        "x": 38,
        "y": 451,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 1727779715201,
        "type": "TextArea",
        "x": 225,
        "y": 395,
        "width": 549,
        "height": 115,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1727779715199,
        "type": "TextArea",
        "x": 20,
        "y": 521,
        "width": 858,
        "height": 346,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 55,
        "type": "CheckBox",
        "x": 30,
        "y": 79,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 5
      },
      {
        "id": 56,
        "type": "CheckBox",
        "x": 44,
        "y": 97,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 5
      },
      {
        "id": 57,
        "type": "CheckBox",
        "x": 45,
        "y": 116,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 5
      },
      {
        "id": 1727780161446,
        "type": "TextField",
        "x": 356.6666666666667,
        "y": 77.66666666666667,
        "width": 318,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 59,
        "type": "CheckBox",
        "x": 30,
        "y": 164,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 5
      },
      {
        "id": 61,
        "type": "CheckBox",
        "x": 31,
        "y": 235,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "page": 5
      },
      {
        "id": 1727780193742,
        "type": "TextArea",
        "x": 26.666666666666668,
        "y": 346.6666666666667,
        "width": 842,
        "height": 207,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1727780199990,
        "type": "TextField",
        "x": 35,
        "y": 515.3333333333334,
        "width": 382,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1727780206682,
        "type": "TextField",
        "x": 75.66666666666667,
        "y": 580.6666666666666,
        "width": 777,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1727780210581,
        "type": "TextField",
        "x": 35.333333333333336,
        "y": 633.6666666666666,
        "width": 380,
        "height": 20,
        "value": "",
        "fontSize": 9,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1727783732785,
        "type": "TextField",
        "x": 388,
        "y": 77,
        "width": 310,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727783742312,
        "type": "TextField",
        "x": 260,
        "y": 76.33333333333333,
        "width": 67,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727783748649,
        "type": "TextField",
        "x": 70.66666666666667,
        "y": 108.66666666666667,
        "width": 784,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727783763440,
        "type": "TextField",
        "x": 172.66666666666666,
        "y": 92.66666666666667,
        "width": 630,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727783781532,
        "type": "TextField",
        "x": 98.66666666666667,
        "y": 124.66666666666667,
        "width": 310,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727783798798,
        "type": "TextField",
        "x": 444,
        "y": 125.33333333333333,
        "width": 224,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 73,
        "type": "CheckBox",
        "x": 115.33333333333333,
        "y": 139.33333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 74,
        "type": "CheckBox",
        "x": 169,
        "y": 139,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1727783820669,
        "type": "TextField",
        "x": 20,
        "y": 158,
        "width": 861,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727783732784,
        "type": "TextField",
        "x": 389.3333333333333,
        "y": 183.33333333333334,
        "width": 307,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727783742311,
        "type": "TextField",
        "x": 260,
        "y": 182,
        "width": 67,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727783748648,
        "type": "TextField",
        "x": 70,
        "y": 216.66666666666666,
        "width": 784,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727783763439,
        "type": "TextField",
        "x": 171.33333333333334,
        "y": 199.66666666666666,
        "width": 631,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727783781531,
        "type": "TextField",
        "x": 97.33333333333333,
        "y": 232.33333333333334,
        "width": 309,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727783798797,
        "type": "TextField",
        "x": 444.6666666666667,
        "y": 231.66666666666666,
        "width": 222,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": "id-73-1",
        "type": "CheckBox",
        "x": 116,
        "y": 249,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": "id-73-3",
        "type": "CheckBox",
        "x": 169.33333333333334,
        "y": 246,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1727783820668,
        "type": "TextField",
        "x": 19.333333333333332,
        "y": 265.3333333333333,
        "width": 859,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 85,
        "type": "CheckBox",
        "x": 17.333333333333332,
        "y": 305,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1727786607571,
        "type": "TextField",
        "x": 114.66666666666667,
        "y": 305.6666666666667,
        "width": 258,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 87,
        "type": "CheckBox",
        "x": 292.3333333333333,
        "y": 304,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1727786615405,
        "type": "TextField",
        "x": 450.6666666666667,
        "y": 305,
        "width": 214,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 89,
        "type": "CheckBox",
        "x": 18,
        "y": 321.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1727786625007,
        "type": "TextField",
        "x": 126.66666666666667,
        "y": 321.3333333333333,
        "width": 239,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 91,
        "type": "CheckBox",
        "x": 292.3333333333333,
        "y": 321.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 92,
        "type": "CheckBox",
        "x": 451.3333333333333,
        "y": 321,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 93,
        "type": "CheckBox",
        "x": 116.66666666666667,
        "y": 562,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 94,
        "type": "CheckBox",
        "x": 30.666666666666668,
        "y": 562,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 95,
        "type": "CheckBox",
        "x": 116,
        "y": 593,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 96,
        "type": "CheckBox",
        "x": 31,
        "y": 593.3333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1727786677057,
        "type": "TextField",
        "x": 133,
        "y": 607,
        "width": 690,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 98,
        "type": "CheckBox",
        "x": 117,
        "y": 641,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 99,
        "type": "CheckBox",
        "x": 31.666666666666668,
        "y": 640.6666666666666,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1727786687317,
        "type": "TextField",
        "x": 133.33333333333334,
        "y": 655,
        "width": 688,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 101,
        "type": "CheckBox",
        "x": 204.33333333333334,
        "y": 688,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 102,
        "type": "CheckBox",
        "x": 118.33333333333333,
        "y": 687.6666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1727786699783,
        "type": "TextField",
        "x": 134.66666666666666,
        "y": 702,
        "width": 688,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 104,
        "type": "CheckBox",
        "x": 116.66666666666667,
        "y": 736,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 105,
        "type": "CheckBox",
        "x": 31,
        "y": 736.3333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1727786747258,
        "type": "TextField",
        "x": 133,
        "y": 750.3333333333334,
        "width": 690,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728024465671,
        "type": "TextArea",
        "x": 44.666666666666664,
        "y": 206.66666666666666,
        "width": 818,
        "height": 42,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1728024475895,
        "type": "TextArea",
        "x": 44.666666666666664,
        "y": 279.3333333333333,
        "width": 816,
        "height": 42,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1728024725971,
        "type": "TextArea",
        "x": 20,
        "y": 224.66666666666666,
        "width": 414,
        "height": 36,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      }
    ]
  }

  if (formType === 'Form8A') {
    staticFields = [
      {
        "id": 1727907244556,
        "type": "TextField",
        "x": 148,
        "y": 88,
        "width": 397,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtOfficeAddress"
      },
      {
        "id": 1727907252963,
        "type": "TextField",
        "x": 148.66666666666666,
        "y": 59.333333333333336,
        "width": 394,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtName"
      },
      {
        "id": 1727907260389,
        "type": "TextField",
        "x": 440,
        "y": 54.666666666666664,
        "width": 202,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727907265737,
        "type": "TextField",
        "x": 117.33333333333333,
        "y": 168.66666666666666,
        "width": 286,
        "height": 20,
        "value": "applicant.fullLegalName",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.fullLegalName"
      },
      {
        "id": 1727907273995,
        "type": "TextField",
        "x": 116.66666666666667,
        "y": 184.66666666666666,
        "width": 287,
        "height": 20,
        "value": "applicant.address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.address"
      },
      {
        "id": 1727907391874,
        "type": "TextField",
        "x": 116,
        "y": 199.33333333333334,
        "width": 288,
        "height": 20,
        "value": "applicant.phoneAndFax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.phoneAndFax"
      },
      {
        "id": 1727907411944,
        "type": "TextField",
        "x": 116,
        "y": 213.33333333333334,
        "width": 288,
        "height": 21,
        "value": "applicant.email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.email"
      },
      {
        "id": 1727907473958,
        "type": "TextField",
        "x": 381.3333333333333,
        "y": 168.66666666666666,
        "width": 291,
        "height": 20,
        "value": "applicantsLawyer.fullLegalName",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicantsLawyer.fullLegalName"
      },
      {
        "id": 1727907556986,
        "type": "TextField",
        "x": 381.3333333333333,
        "y": 184.66666666666666,
        "width": 291,
        "height": 20,
        "value": "applicantsLawyer.address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicantsLawyer.address"
      },
      {
        "id": 1727907564464,
        "type": "TextField",
        "x": 381.3333333333333,
        "y": 199.33333333333334,
        "width": 292,
        "height": 20,
        "value": "applicantsLawyer.phoneAndFax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicantsLawyer.phoneAndFax"
      },
      {
        "id": 1727907572538,
        "type": "TextField",
        "x": 382,
        "y": 214.66666666666666,
        "width": 292,
        "height": 20,
        "value": "applicantsLawyer.email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicantsLawyer.email"
      },
      {
        "id": 1727907582533,
        "type": "TextField",
        "x": 116,
        "y": 258.6666666666667,
        "width": 290,
        "height": 20,
        "value": "respondent.fullLegalName",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondent.fullLegalName"
      },
      {
        "id": 1727907589036,
        "type": "TextField",
        "x": 115.33333333333333,
        "y": 274,
        "width": 291,
        "height": 20,
        "value": "respondent.address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondent.address"
      },
      {
        "id": 1727907596334,
        "type": "TextField",
        "x": 115.33333333333333,
        "y": 288.6666666666667,
        "width": 291,
        "height": 20,
        "value": "respondent.phoneAndFax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondent.phoneAndFax"
      },
      {
        "id": 1727907603108,
        "type": "TextField",
        "x": 115.33333333333333,
        "y": 304,
        "width": 291,
        "height": 20,
        "value": "respondent.email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondent.email"
      },
      {
        "id": 1727907612474,
        "type": "TextField",
        "x": 381.3333333333333,
        "y": 258,
        "width": 290,
        "height": 20,
        "value": "respondentsLawyer.fullLegalName",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondentsLawyer.fullLegalName"
      },
      {
        "id": 1727907619158,
        "type": "TextField",
        "x": 382,
        "y": 273.3333333333333,
        "width": 290,
        "height": 20,
        "value": "respondentsLawyer.address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondentsLawyer.address"
      },
      {
        "id": 1727907625652,
        "type": "TextField",
        "x": 382,
        "y": 288.6666666666667,
        "width": 290,
        "height": 19,
        "value": "respondentsLawyer.phoneAndFax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondentsLawyer.phoneAndFax"
      },
      {
        "id": 1727907638814,
        "type": "TextField",
        "x": 381.3333333333333,
        "y": 303.3333333333333,
        "width": 291,
        "height": 20,
        "value": "respondentsLawyer.email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondentsLawyer.email"
      },
      {
        "id": 20,
        "type": "CheckBox",
        "x": 52.666666666666664,
        "y": 349.3333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 21,
        "type": "CheckBox",
        "x": 459.3333333333333,
        "y": 108.66666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 22,
        "type": "CheckBox",
        "x": 459.3333333333333,
        "y": 129.33333333333334,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 23,
        "type": "CheckBox",
        "x": 54,
        "y": 84.66666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1727907689043,
        "type": "TextField",
        "x": 440.6666666666667,
        "y": 40.666666666666664,
        "width": 205,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727907716210,
        "type": "TextField",
        "x": 49.333333333333336,
        "y": 714,
        "width": 382,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727907876975,
        "type": "TextField",
        "x": 439.3333333333333,
        "y": 39.333333333333336,
        "width": 213,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727907896129,
        "type": "TextField",
        "x": 110,
        "y": 85.33333333333333,
        "width": 712,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 1727907902640,
        "type": "TextField",
        "x": 47.333333333333336,
        "y": 156,
        "width": 382,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 1727907914902,
        "type": "TextField",
        "x": 110.66666666666667,
        "y": 189.33333333333334,
        "width": 710,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 1727907925899,
        "type": "TextField",
        "x": 47.333333333333336,
        "y": 260,
        "width": 389,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 1727907941512,
        "type": "TextField",
        "x": 439.3333333333333,
        "y": 38.666666666666664,
        "width": 213,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727907964021,
        "type": "TextField",
        "x": 200.66666666666666,
        "y": 59.333333333333336,
        "width": 426,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1727907974054,
        "type": "TextField",
        "x": 115.33333333333333,
        "y": 78,
        "width": 352,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 34,
        "type": "CheckBox",
        "x": 56,
        "y": 62,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 5
      },
      {
        "id": 1727907986349,
        "type": "TextArea",
        "x": 50,
        "y": 188,
        "width": 796,
        "height": 89,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1727907992507,
        "type": "TextArea",
        "x": 50,
        "y": 279.3333333333333,
        "width": 795,
        "height": 182,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1727908011047,
        "type": "TextField",
        "x": 47.333333333333336,
        "y": 608.6666666666666,
        "width": 378,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1727908011346,
        "type": "TextField",
        "x": 47.333333333333336,
        "y": 662,
        "width": 380,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1727908011698,
        "type": "TextField",
        "x": 47.333333333333336,
        "y": 696,
        "width": 382,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 40,
        "type": "CheckBox",
        "x": 77.33333333333333,
        "y": 80.66666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 41,
        "type": "CheckBox",
        "x": 133.33333333333334,
        "y": 80,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 42,
        "type": "CheckBox",
        "x": 101.33333333333333,
        "y": 143.33333333333334,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 43,
        "type": "CheckBox",
        "x": 156,
        "y": 143.33333333333334,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 1727908068693,
        "type": "TextField",
        "x": 78,
        "y": 97.33333333333333,
        "width": 752,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1727908083470,
        "type": "TextArea",
        "x": 78.66666666666667,
        "y": 158.66666666666666,
        "width": 752,
        "height": 38,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 46,
        "type": "255.333333333333344",
        "x": 73.33333333333333,
        "y": 255.33333333333334,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 47,
        "type": "CheckBox",
        "x": 72.66666666666667,
        "y": 268.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 48,
        "type": "CheckBox",
        "x": 73.33333333333333,
        "y": 282,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 49,
        "type": "CheckBox",
        "x": 73.33333333333333,
        "y": 308.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 50,
        "type": "CheckBox",
        "x": 73.33333333333333,
        "y": 334,
        "width": 19,
        "height": 19,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 51,
        "type": "CheckBox",
        "x": 72.66666666666667,
        "y": 359.3333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 52,
        "type": "CheckBox",
        "x": 246,
        "y": 255.33333333333334,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 53,
        "type": "CheckBox",
        "x": 246,
        "y": 269.3333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 54,
        "type": "CheckBox",
        "x": 246,
        "y": 296,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 55,
        "type": "CheckBox",
        "x": 246.66666666666666,
        "y": 321.3333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 56,
        "type": "CheckBox",
        "x": 246,
        "y": 346,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 57,
        "type": "CheckBox",
        "x": 246,
        "y": 360,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 58,
        "type": "CheckBox",
        "x": 246.66666666666666,
        "y": 372.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 59,
        "type": "CheckBox",
        "x": 246,
        "y": 385.3333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 60,
        "type": "CheckBox",
        "x": 246.66666666666666,
        "y": 398,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 61,
        "type": "CheckBox",
        "x": 438,
        "y": 255.33333333333334,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 62,
        "type": "CheckBox",
        "x": 438,
        "y": 282.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 63,
        "type": "CheckBox",
        "x": 439.3333333333333,
        "y": 308.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 64,
        "type": "CheckBox",
        "x": 439.3333333333333,
        "y": 359.3333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 65,
        "type": "CheckBox",
        "x": 439.3333333333333,
        "y": 373.3333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 66,
        "type": "CheckBox",
        "x": 439.3333333333333,
        "y": 421.3333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 67,
        "type": "CheckBox",
        "x": 438.6666666666667,
        "y": 434.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 68,
        "type": "CheckBox",
        "x": 438.6666666666667,
        "y": 448,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 69,
        "type": "CheckBox",
        "x": 438.6666666666667,
        "y": 460,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 70,
        "type": "CheckBox",
        "x": 72.66666666666667,
        "y": 550.6666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 71,
        "type": "CheckBox",
        "x": 250,
        "y": 551.3333333333334,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 72,
        "type": "CheckBox",
        "x": 56.666666666666664,
        "y": 594.6666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 73,
        "type": "CheckBox",
        "x": 80,
        "y": 612,
        "width": 20,
        "height": 23,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 74,
        "type": "CheckBox",
        "x": 80,
        "y": 626.6666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 75,
        "type": "CheckBox",
        "x": 56.666666666666664,
        "y": 664.6666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 1727908285491,
        "type": "TextField",
        "x": 388.6666666666667,
        "y": 593.3333333333334,
        "width": 249,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1727908285881,
        "type": "TextField",
        "x": 207.33333333333334,
        "y": 664,
        "width": 380,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1727908463801,
        "type": "TextField",
        "x": 188.66666666666666,
        "y": 83.33333333333333,
        "width": 102,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727908464227,
        "type": "TextField",
        "x": 347.3333333333333,
        "y": 82,
        "width": 349,
        "height": 20,
        "value": "applicant.dateOfBirth",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "applicant.dateOfBirth"
      },
      {
        "id": 1727908464586,
        "type": "TextField",
        "x": 209.33333333333334,
        "y": 102,
        "width": 287,
        "height": 20,
        "value": "applicant.municipality",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "applicant.municipality"
      },
      {
        "id": 1727908464934,
        "type": "TextField",
        "x": 458.6666666666667,
        "y": 102,
        "width": 180,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727908465256,
        "type": "TextField",
        "x": 266,
        "y": 120,
        "width": 468,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727908465541,
        "type": "TextField",
        "x": 266,
        "y": 137.33333333333334,
        "width": 469,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727908465841,
        "type": "TextField",
        "x": 49.333333333333336,
        "y": 208.66666666666666,
        "width": 796,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727908533911,
        "type": "TextField",
        "x": 257.3333333333333,
        "y": 240,
        "width": 79,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727908534233,
        "type": "TextField",
        "x": 398,
        "y": 240.66666666666666,
        "width": 273,
        "height": 20,
        "value": "respondent.dateOfBirth",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "respondent.dateOfBirth"
      },
      {
        "id": 1727908534533,
        "type": "TextField",
        "x": 208.66666666666666,
        "y": 258,
        "width": 288,
        "height": 20,
        "value": "respondent.province",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "respondent.province"
      },
      {
        "id": 1727908534856,
        "type": "TextField",
        "x": 458,
        "y": 258,
        "width": 181,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727908535133,
        "type": "TextField",
        "x": 266,
        "y": 276.6666666666667,
        "width": 469,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727908535426,
        "type": "TextField",
        "x": 266,
        "y": 294,
        "width": 469,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727908535726,
        "type": "TextField",
        "x": 49.333333333333336,
        "y": 365.3333333333333,
        "width": 792,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 92,
        "type": "CheckBox",
        "x": 52.666666666666664,
        "y": 174,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 93,
        "type": "CheckBox",
        "x": 142.66666666666666,
        "y": 174,
        "width": 19,
        "height": 27,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 94,
        "type": "CheckBox",
        "x": 255.33333333333334,
        "y": 174,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 95,
        "type": "CheckBox",
        "x": 389.3333333333333,
        "y": 173.33333333333334,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 96,
        "type": "CheckBox",
        "x": 150.66666666666666,
        "y": 192.66666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 97,
        "type": "CheckBox",
        "x": 203.33333333333334,
        "y": 192,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 98,
        "type": "CheckBox",
        "x": 51.333333333333336,
        "y": 332,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 99,
        "type": "CheckBox",
        "x": 140,
        "y": 332,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 100,
        "type": "CheckBox",
        "x": 254,
        "y": 332,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 101,
        "type": "CheckBox",
        "x": 390.6666666666667,
        "y": 332,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 102,
        "type": "CheckBox",
        "x": 151.33333333333334,
        "y": 350.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 103,
        "type": "CheckBox",
        "x": 202.66666666666666,
        "y": 350.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 104,
        "type": "CheckBox",
        "x": 52,
        "y": 422,
        "width": 20,
        "height": 21,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3,
        "bind": "relationshipDates.marriedOn"
      },
      {
        "id": 105,
        "type": "CheckBox",
        "x": 298,
        "y": 420.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 106,
        "type": "CheckBox",
        "x": 51.333333333333336,
        "y": 439.3333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 107,
        "type": "CheckBox",
        "x": 297.3333333333333,
        "y": 439.3333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1727908708131,
        "type": "TextField",
        "x": 152,
        "y": 419.3333333333333,
        "width": 217,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727908708335,
        "type": "TextField",
        "x": 458,
        "y": 419.3333333333333,
        "width": 181,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727908708513,
        "type": "TextField",
        "x": 166,
        "y": 437.3333333333333,
        "width": 192,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 111,
        "type": "CheckBox",
        "x": 69.33333333333333,
        "y": 686,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 112,
        "type": "CheckBox",
        "x": 142.66666666666666,
        "y": 686.6666666666666,
        "width": 19,
        "height": 17,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 113,
        "type": "CheckBox",
        "x": 69.33333333333333,
        "y": 722,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 114,
        "type": "CheckBox",
        "x": 142,
        "y": 722,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1727908792455,
        "type": "TextField",
        "x": 439.3333333333333,
        "y": 38,
        "width": 204,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727910649562,
        "type": "TextField",
        "x": 439.3333333333333,
        "y": 38.666666666666664,
        "width": 150,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4,
        "bind": "court_info.courtFileNumber"
      }
    ]
  }

  if (formType === 'Form10') {
    staticFields = [
      {
        "id": 1727907244556,
        "type": "TextField",
        "x": 58.666666666666664,
        "y": 87.33333333333333,
        "width": 535,
        "height": 20,
        "value": "ARDC Building 111 Queen St, PO Box 2000, Armstrong, Ontario P0T 1A0",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtOfficeAddress"
      },
      {
        "id": 1727907252963,
        "type": "TextField",
        "x": 58.666666666666664,
        "y": 57.333333333333336,
        "width": 535,
        "height": 20,
        "value": "Armstrong Courthouse",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtName"
      },
      {
        "id": 1727907260389,
        "type": "TextField",
        "x": 440,
        "y": 57.333333333333336,
        "width": 202,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727907265737,
        "type": "TextField",
        "x": 114,
        "y": 140.66666666666666,
        "width": 286,
        "height": 20,
        "value": "applicant.fullLegalName",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.fullLegalName"
      },
      {
        "id": 1727907273995,
        "type": "TextField",
        "x": 114,
        "y": 155.33333333333334,
        "width": 287,
        "height": 20,
        "value": "applicant.address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.address"
      },
      {
        "id": 1727907391874,
        "type": "TextField",
        "x": 114,
        "y": 170,
        "width": 288,
        "height": 20,
        "value": "applicant.phoneAndFax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.phoneAndFax"
      },
      {
        "id": 1727907411944,
        "type": "TextField",
        "x": 114,
        "y": 184,
        "width": 288,
        "height": 21,
        "value": "applicant.email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.email"
      },
      {
        "id": 1727907473958,
        "type": "TextField",
        "x": 382.6666666666667,
        "y": 141.33333333333334,
        "width": 291,
        "height": 20,
        "value": "applicantsLawyer.fullLegalName",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicantsLawyer.fullLegalName"
      },
      {
        "id": 1727907556986,
        "type": "TextField",
        "x": 382.6666666666667,
        "y": 155.33333333333334,
        "width": 291,
        "height": 20,
        "value": "applicantsLawyer.address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicantsLawyer.address"
      },
      {
        "id": 1727907564464,
        "type": "TextField",
        "x": 382.6666666666667,
        "y": 170.66666666666666,
        "width": 292,
        "height": 20,
        "value": "applicantsLawyer.phoneAndFax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicantsLawyer.phoneAndFax"
      },
      {
        "id": 1727907572538,
        "type": "TextField",
        "x": 382.6666666666667,
        "y": 185.33333333333334,
        "width": 292,
        "height": 20,
        "value": "applicantsLawyer.email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicantsLawyer.email"
      },
      {
        "id": 1727907582533,
        "type": "TextField",
        "x": 114,
        "y": 229,
        "width": 290,
        "height": 20,
        "value": "respondent.fullLegalName",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondent.fullLegalName"
      },
      {
        "id": 1727907589036,
        "type": "TextField",
        "x": 114,
        "y": 244,
        "width": 291,
        "height": 20,
        "value": "respondent.address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondent.address"
      },
      {
        "id": 1727907596334,
        "type": "TextField",
        "x": 114,
        "y": 258.6666666666667,
        "width": 291,
        "height": 20,
        "value": "respondent.phoneAndFax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondent.phoneAndFax"
      },
      {
        "id": 1727907603108,
        "type": "TextField",
        "x": 114,
        "y": 272.6666666666667,
        "width": 291,
        "height": 20,
        "value": "respondent.email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondent.email"
      },
      {
        "id": 1727907612474,
        "type": "TextField",
        "x": 382,
        "y": 229.33333333333334,
        "width": 290,
        "height": 20,
        "value": "respondentsLawyer.fullLegalName",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondentsLawyer.fullLegalName"
      },
      {
        "id": 1727907619158,
        "type": "TextField",
        "x": 382,
        "y": 244,
        "width": 290,
        "height": 20,
        "value": "respondentsLawyer.address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondentsLawyer.address"
      },
      {
        "id": 1727907625652,
        "type": "TextField",
        "x": 382,
        "y": 258.6666666666667,
        "width": 290,
        "height": 19,
        "value": "respondentsLawyer.phoneAndFax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondentsLawyer.phoneAndFax"
      },
      {
        "id": 1727907638814,
        "type": "TextField",
        "x": 382,
        "y": 272,
        "width": 291,
        "height": 20,
        "value": "respondentsLawyer.email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondentsLawyer.email"
      },
      {
        "id": 1727914463987,
        "type": "TextArea",
        "x": 42,
        "y": 326,
        "width": 815,
        "height": 65,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727914477696,
        "type": "TextArea",
        "x": 69.33333333333333,
        "y": 687.3333333333334,
        "width": 779,
        "height": 111,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727914487872,
        "type": "TextField",
        "x": 167.33333333333334,
        "y": 607.3333333333334,
        "width": 459,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727914495740,
        "type": "TextField",
        "x": 167.33333333333334,
        "y": 624.6666666666666,
        "width": 631,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727914503946,
        "type": "TextField",
        "x": 167.33333333333334,
        "y": 642.6666666666666,
        "width": 632,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727914514693,
        "type": "TextField",
        "x": 449.3333333333333,
        "y": 46.666666666666664,
        "width": 150,
        "height": 20,
        "value": "court_info.courtFileNumber",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727914537687,
        "type": "TextArea",
        "x": 68,
        "y": 110.66666666666667,
        "width": 778,
        "height": 46,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 27,
        "type": "CheckBox",
        "x": 349.3333333333333,
        "y": 188,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 28,
        "type": "CheckBox",
        "x": 73.33333333333333,
        "y": 190,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 29,
        "type": "CheckBox",
        "x": 72.66666666666667,
        "y": 162.66666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 30,
        "type": "CheckBox",
        "x": 73.33333333333333,
        "y": 144,
        "width": "20",
        "height": "20",
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 31,
        "type": "CheckBox",
        "x": 350,
        "y": 202.66666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1727914580818,
        "type": "TextArea",
        "x": 70.66666666666667,
        "y": 270.6666666666667,
        "width": 767,
        "height": 711,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727914597431,
        "type": "TextField",
        "x": 448.6666666666667,
        "y": 46.666666666666664,
        "width": 150,
        "height": 20,
        "value": "court_info.courtFileNumber",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727914607693,
        "type": "TextField",
        "x": 40,
        "y": 296,
        "width": 390,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727914614186,
        "type": "TextField",
        "x": 40.666666666666664,
        "y": 428,
        "width": 385,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727914619788,
        "type": "TextField",
        "x": 105.33333333333333,
        "y": 367.3333333333333,
        "width": 726,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727914644637,
        "type": "TextField",
        "x": 450,
        "y": 46.666666666666664,
        "width": 150,
        "height": 20,
        "value": "court_info.courtFileNumber",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727914657267,
        "type": "TextField",
        "x": 448,
        "y": 46.666666666666664,
        "width": 150,
        "height": 20,
        "value": "court_info.courtFileNumber",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1727914667285,
        "type": "TextArea",
        "x": 40.666666666666664,
        "y": 120.66666666666667,
        "width": 817,
        "height": 400,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1727914736390,
        "type": "TextField",
        "x": 38.666666666666664,
        "y": 646.6666666666666,
        "width": 351,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 41,
        "type": "CheckBox",
        "x": 80.66666666666667,
        "y": 116,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 42,
        "type": "CheckBox",
        "x": 80,
        "y": 130.66666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 1727914759910,
        "type": "TextField",
        "x": 341.3333333333333,
        "y": 128,
        "width": 377,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 44,
        "type": "CheckBox",
        "x": 66,
        "y": 244.66666666666666,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 45,
        "type": "CheckBox",
        "x": 66,
        "y": 256,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 46,
        "type": "CheckBox",
        "x": 66.66666666666667,
        "y": 268.6666666666667,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 47,
        "type": "CheckBox",
        "x": 65.33333333333333,
        "y": 289.3333333333333,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 48,
        "type": "CheckBox",
        "x": 66,
        "y": 311.3333333333333,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 49,
        "type": "CheckBox",
        "x": 66,
        "y": 334.6666666666667,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 50,
        "type": "CheckBox",
        "x": 66,
        "y": 347.3333333333333,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 51,
        "type": "CheckBox",
        "x": 246,
        "y": 245.33333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 52,
        "type": "CheckBox",
        "x": 246,
        "y": 266,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 53,
        "type": "CheckBox",
        "x": 245.33333333333334,
        "y": 289.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 54,
        "type": "CheckBox",
        "x": 246,
        "y": 310.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 55,
        "type": "CheckBox",
        "x": 246,
        "y": 324,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 56,
        "type": "CheckBox",
        "x": 436.6666666666667,
        "y": 255.33333333333334,
        "width": "15",
        "height": "15",
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 57,
        "type": "CheckBox",
        "x": 436,
        "y": 266,
        "width": 15,
        "height": 15,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 58,
        "type": "CheckBox",
        "x": 436,
        "y": 279.3333333333333,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 59,
        "type": "CheckBox",
        "x": 435.3333333333333,
        "y": 301.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 60,
        "type": "CheckBox",
        "x": 436.6666666666667,
        "y": 323.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 61,
        "type": "CheckBox",
        "x": 436.6666666666667,
        "y": 243.33333333333334,
        "width": 15,
        "height": 15,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 1727914922930,
        "type": "TextField",
        "x": 504,
        "y": 335.3333333333333,
        "width": 66,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1727914924910,
        "type": "TextField",
        "x": 466.6666666666667,
        "y": 312,
        "width": 66,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1727914927175,
        "type": "TextField",
        "x": 484,
        "y": 288,
        "width": 150,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 65,
        "type": "CheckBox",
        "x": 441.3333333333333,
        "y": 393.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 1727914951256,
        "type": "TextArea",
        "x": 422,
        "y": 412,
        "width": 247,
        "height": 155,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 67,
        "type": "CheckBox",
        "x": 246,
        "y": 392.6666666666667,
        "width": "15",
        "height": "15",
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 68,
        "type": "CheckBox",
        "x": 246,
        "y": 404.6666666666667,
        "width": "15",
        "height": "15",
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 69,
        "type": "CheckBox",
        "x": 246,
        "y": 415,
        "width": 15,
        "height": 15,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 70,
        "type": "CheckBox",
        "x": 246,
        "y": 427.3333333333333,
        "width": 15,
        "height": 15,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 1727915043888,
        "type": "TextArea",
        "x": 46,
        "y": 669.3333333333334,
        "width": 814,
        "height": 139,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 72,
        "type": "CheckBox",
        "x": 66,
        "y": 394,
        "width": "15",
        "height": "15",
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 73,
        "type": "CheckBox",
        "x": 66.66666666666667,
        "y": 404.6666666666667,
        "width": "15",
        "height": "15",
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 74,
        "type": "CheckBox",
        "x": 66.66666666666667,
        "y": 416,
        "width": "15",
        "height": "15",
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 75,
        "type": "CheckBox",
        "x": 66.66666666666667,
        "y": 436.6666666666667,
        "width": "15",
        "height": "15",
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 76,
        "type": "CheckBox",
        "x": 66.66666666666667,
        "y": 457.3333333333333,
        "width": "15",
        "height": "15",
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 77,
        "type": "CheckBox",
        "x": 66.66666666666667,
        "y": 468.6666666666667,
        "width": "15",
        "height": "15",
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 78,
        "type": "CheckBox",
        "x": 66.66666666666667,
        "y": 479.3333333333333,
        "width": "15",
        "height": "15",
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 79,
        "type": "CheckBox",
        "x": 66.66666666666667,
        "y": 490.6666666666667,
        "width": "15",
        "height": "15",
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 80,
        "type": "CheckBox",
        "x": 66,
        "y": 501.3333333333333,
        "width": "15",
        "height": "15",
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 81,
        "type": "CheckBox",
        "x": 66.66666666666667,
        "y": 512,
        "width": 15,
        "height": 15,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 82,
        "type": "CheckBox",
        "x": 66,
        "y": 532,
        "width": "15",
        "height": "15",
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 83,
        "type": "CheckBox",
        "x": 66.66666666666667,
        "y": 585.3333333333334,
        "width": 15,
        "height": 15,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      }
    ]
  }

  if (formType === 'Form6B') {
    staticFields = [
      {
        "id": 1727913037366,
        "type": "TextField",
        "x": 33.333333333333336,
        "y": 48.666666666666664,
        "width": 479,
        "height": 20,
        "value": "court_info.courtName",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913063544,
        "type": "TextField",
        "x": 33.333333333333336,
        "y": 78,
        "width": "479",
        "height": 20,
        "value": "court_info.courtOfficeAddress",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtOfficeAddress"
      },
      {
        "id": 1727913117301,
        "type": "TextField",
        "x": 435.3333333333333,
        "y": 48,
        "width": 150,
        "height": 20,
        "value": "court_info.courtFileNumber",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727913142615,
        "type": "TextField",
        "x": 435.3333333333333,
        "y": 30.666666666666668,
        "width": 150,
        "height": 20,
        "value": "court_info.courtFileNumber",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727913151912,
        "type": "TextField",
        "x": 434.6666666666667,
        "y": 31.333333333333332,
        "width": 150,
        "height": 20,
        "value": "court_info.courtFileNumber",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727913182986,
        "type": "TextField",
        "x": 143.33333333333334,
        "y": 300.6666666666667,
        "width": 673,
        "height": 20,
        "value": "applicant.fullLegalName",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.fullLegalName"
      },
      {
        "id": 1727913199821,
        "type": "TextField",
        "x": 156.66666666666666,
        "y": 319.3333333333333,
        "width": 654,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.municipality"
      },
      {
        "id": 1727913250284,
        "type": "TextField",
        "x": 449.3333333333333,
        "y": 94,
        "width": 217,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913276710,
        "type": "TextField",
        "x": 80,
        "y": 355.3333333333333,
        "width": 230,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913285762,
        "type": "TextField",
        "x": 279.3333333333333,
        "y": 356,
        "width": 188,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913292365,
        "type": "TextField",
        "x": 34.666666666666664,
        "y": 374.6666666666667,
        "width": 514,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913323906,
        "type": "TextField",
        "x": 70,
        "y": 455.3333333333333,
        "width": "220",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913324612,
        "type": "TextField",
        "x": 70,
        "y": 474.6666666666667,
        "width": "220",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913324993,
        "type": "TextField",
        "x": 70.66666666666667,
        "y": 494,
        "width": "220",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913325460,
        "type": "TextField",
        "x": 70.66666666666667,
        "y": 512.6666666666666,
        "width": "220",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913328705,
        "type": "TextField",
        "x": 70.66666666666667,
        "y": 532,
        "width": "220",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913352835,
        "type": "TextField",
        "x": 70,
        "y": 437.3333333333333,
        "width": "220",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913362772,
        "type": "TextField",
        "x": 70,
        "y": 418,
        "width": "220",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913411779,
        "type": "TextField",
        "x": 446,
        "y": 531.3333333333334,
        "width": "215",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913412255,
        "type": "TextField",
        "x": 284,
        "y": 436.6666666666667,
        "width": 150,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913412577,
        "type": "TextField",
        "x": 284,
        "y": 455.3333333333333,
        "width": 150,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913412869,
        "type": "TextField",
        "x": 284,
        "y": 474,
        "width": 150,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913413117,
        "type": "TextField",
        "x": 284,
        "y": 492.6666666666667,
        "width": 150,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913413358,
        "type": "TextField",
        "x": 284,
        "y": 511.3333333333333,
        "width": 150,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913413679,
        "type": "TextField",
        "x": 284,
        "y": 531.3333333333334,
        "width": 150,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913444205,
        "type": "TextField",
        "x": 284,
        "y": 418,
        "width": 150,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913490651,
        "type": "TextField",
        "x": 446,
        "y": 418,
        "width": "215",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913491333,
        "type": "TextField",
        "x": 446,
        "y": 436.6666666666667,
        "width": "215",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913491626,
        "type": "TextField",
        "x": 446,
        "y": 455.3333333333333,
        "width": "215",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913491955,
        "type": "TextField",
        "x": 446,
        "y": 474.6666666666667,
        "width": "215",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913492264,
        "type": "TextField",
        "x": 446,
        "y": 492.6666666666667,
        "width": "215",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727913492646,
        "type": "TextField",
        "x": 446,
        "y": 510.6666666666667,
        "width": "215",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 33,
        "type": "CheckBox",
        "x": 77.33333333333333,
        "y": 722.6666666666666,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 34,
        "type": "CheckBox",
        "x": 76.66666666666667,
        "y": 741.3333333333334,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 35,
        "type": "CheckBox",
        "x": 78,
        "y": 652,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 36,
        "type": "CheckBox",
        "x": 78,
        "y": 614,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 37,
        "type": "CheckBox",
        "x": 77.33333333333333,
        "y": 686,
        "width": 20,
        "height": 21,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 38,
        "type": "CheckBox",
        "x": 78,
        "y": 704.6666666666666,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 39,
        "type": "CheckBox",
        "x": 78,
        "y": 631.3333333333334,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 40,
        "type": "CheckBox",
        "x": 76.66666666666667,
        "y": 668.6666666666666,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 41,
        "type": "CheckBox",
        "x": 78,
        "y": 595.3333333333334,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 42,
        "type": "CheckBox",
        "x": 77.33333333333333,
        "y": 101.33333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 43,
        "type": "CheckBox",
        "x": 78,
        "y": 118.66666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 44,
        "type": "CheckBox",
        "x": 95.33333333333333,
        "y": 136.66666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 45,
        "type": "CheckBox",
        "x": 95.33333333333333,
        "y": 154.66666666666666,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 46,
        "type": "CheckBox",
        "x": 95.33333333333333,
        "y": 172.66666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 47,
        "type": "CheckBox",
        "x": 76.66666666666667,
        "y": 209.33333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 48,
        "type": "CheckBox",
        "x": 76.66666666666667,
        "y": 250.66666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 49,
        "type": "CheckBox",
        "x": 76.66666666666667,
        "y": 331.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1727913691918,
        "type": "TextField",
        "x": 34.666666666666664,
        "y": 75.33333333333333,
        "width": 835,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727913697743,
        "type": "TextField",
        "x": 212.66666666666666,
        "y": 118.66666666666667,
        "width": 570,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727913705191,
        "type": "TextField",
        "x": 234,
        "y": 172.66666666666666,
        "width": 539,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727913712444,
        "type": "TextField",
        "x": 124,
        "y": 268.6666666666667,
        "width": 705,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727913720514,
        "type": "TextField",
        "x": 93,
        "y": 347.3333333333333,
        "width": "750",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727913720784,
        "type": "TextField",
        "x": 93,
        "y": 361.3333333333333,
        "width": "750",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727913721063,
        "type": "TextField",
        "x": 93,
        "y": 376,
        "width": "750",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727913721324,
        "type": "TextField",
        "x": 92.66666666666667,
        "y": 390,
        "width": "750",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727913721632,
        "type": "TextField",
        "x": 93,
        "y": 405.3333333333333,
        "width": "750",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727913801542,
        "type": "TextField",
        "x": 61.333333333333336,
        "y": 587.3333333333334,
        "width": 256,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727913801844,
        "type": "TextField",
        "x": 348.6666666666667,
        "y": 586.6666666666666,
        "width": 366,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727913802160,
        "type": "TextField",
        "x": 224.66666666666666,
        "y": 624,
        "width": 553,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727913802474,
        "type": "TextField",
        "x": 415.3333333333333,
        "y": 569.3333333333334,
        "width": 77,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727913802782,
        "type": "TextField",
        "x": 218,
        "y": 548.6666666666666,
        "width": 560,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727913803082,
        "type": "TextField",
        "x": 110.66666666666667,
        "y": 440,
        "width": 721,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727913871201,
        "type": "TextField",
        "x": 216.66666666666666,
        "y": 732,
        "width": 562,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 66,
        "type": "CheckBox",
        "x": 134.66666666666666,
        "y": 549.3333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 67,
        "type": "CheckBox",
        "x": 134.66666666666666,
        "y": 532,
        "width": "20",
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 68,
        "type": "CheckBox",
        "x": 134.66666666666666,
        "y": 514,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 69,
        "type": "CheckBox",
        "x": 134.66666666666666,
        "y": 495.3333333333333,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 70,
        "type": "CheckBox",
        "x": 134,
        "y": 478.6666666666667,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 71,
        "type": "CheckBox",
        "x": 134.66666666666666,
        "y": 460,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 72,
        "type": "CheckBox",
        "x": 134,
        "y": 716,
        "width": "20",
        "height": "20",
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 73,
        "type": "CheckBox",
        "x": 134,
        "y": 734,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 74,
        "type": "CheckBox",
        "x": 134,
        "y": 698,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 75,
        "type": "CheckBox",
        "x": 134,
        "y": 679.3333333333334,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 76,
        "type": "CheckBox",
        "x": 133.33333333333334,
        "y": 642.6666666666666,
        "width": "20",
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 77,
        "type": "CheckBox",
        "x": 133.33333333333334,
        "y": 662,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1727914013794,
        "type": "TextField",
        "x": 92.66666666666667,
        "y": 33.333333333333336,
        "width": 211,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727914048328,
        "type": "TextField",
        "x": 198,
        "y": 190.66666666666666,
        "width": 186,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 80,
        "type": "CheckBox",
        "x": 77.33333333333333,
        "y": 211.33333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 81,
        "type": "CheckBox",
        "x": 77.33333333333333,
        "y": 230,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1727914067461,
        "type": "TextField",
        "x": 35.333333333333336,
        "y": 269.3333333333333,
        "width": "840",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727914067742,
        "type": "TextField",
        "x": 35.333333333333336,
        "y": 284.6666666666667,
        "width": "840",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727914068027,
        "type": "TextField",
        "x": 35.333333333333336,
        "y": 298.6666666666667,
        "width": "840",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727914068343,
        "type": "TextField",
        "x": 35.333333333333336,
        "y": 313.3333333333333,
        "width": "840",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727914102978,
        "type": "TextField",
        "x": 35,
        "y": 347.3333333333333,
        "width": "840",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727914103232,
        "type": "TextField",
        "x": 35,
        "y": 361.3333333333333,
        "width": "840",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727914103489,
        "type": "TextField",
        "x": 35,
        "y": 374.6666666666667,
        "width": "840",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727914103901,
        "type": "TextField",
        "x": 35,
        "y": 390.6666666666667,
        "width": "840",
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727914138513,
        "type": "TextField",
        "x": 219.33333333333334,
        "y": 424,
        "width": 182,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727914147940,
        "type": "TextField",
        "x": 47.333333333333336,
        "y": 442,
        "width": 169,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727914156438,
        "type": "TextField",
        "x": 150.66666666666666,
        "y": 474,
        "width": 385,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727914163372,
        "type": "TextField",
        "x": 32,
        "y": 501.3333333333333,
        "width": 565,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727914170168,
        "type": "TextField",
        "x": 35.333333333333336,
        "y": 530.6666666666666,
        "width": 207,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727914176925,
        "type": "TextField",
        "x": 178.66666666666666,
        "y": 530,
        "width": 344,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727914185882,
        "type": "TextField",
        "x": 92.66666666666667,
        "y": 34,
        "width": 212,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      }
    ]
  }

  if (formType === 'Form10A') {
    staticFields = [
      {
        "id": 1727915370014,
        "type": "TextField",
        "x": 34,
        "y": 58.666666666666664,
        "width": 585,
        "height": 20,
        "value": "court_info.courtName",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtName"
      },
      {
        "id": 1727915389443,
        "type": "TextField",
        "x": 34,
        "y": 88,
        "width": 150,
        "height": 20,
        "value": "court_info.courtOfficeAddress",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtOfficeAddress"
      },
      {
        "id": 1727915418071,
        "type": "TextField",
        "x": 436,
        "y": 58.666666666666664,
        "width": 150,
        "height": 20,
        "value": "court_info.courtFileNumber",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 4,
        "type": "CheckBox",
        "x": 487.3333333333333,
        "y": 89.33333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 5,
        "type": "CheckBox",
        "x": 488,
        "y": 105.33333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1727915453635,
        "type": "TextField",
        "x": 169.33333333333334,
        "y": 568.6666666666666,
        "width": 605,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727915471785,
        "type": "TextArea",
        "x": 49.333333333333336,
        "y": 612,
        "width": 788,
        "height": 38,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727915481497,
        "type": "TextArea",
        "x": 50,
        "y": 667.3333333333334,
        "width": "788",
        "height": 44,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 9,
        "type": "CheckBox",
        "x": 50,
        "y": 700.6666666666666,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1727915505655,
        "type": "TextArea",
        "x": 50.666666666666664,
        "y": 716.6666666666666,
        "width": "788",
        "height": "44",
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727915530277,
        "type": "TextField",
        "x": 434.6666666666667,
        "y": 30.666666666666668,
        "width": 150,
        "height": 20,
        "value": "court_info.courtFileNumber",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727915546185,
        "type": "TextArea",
        "x": 47.333333333333336,
        "y": 92.66666666666667,
        "width": 811,
        "height": 869,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727915549071,
        "type": "TextField",
        "x": 19.333333333333332,
        "y": 720,
        "width": 399,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      }
    ]
  }

  if (formType === 'Form36') {
    staticFields = [
      {
        "id": 1727904901249,
        "type": "TextField",
        "x": 65.33333333333333,
        "y": 82,
        "width": 521,
        "height": 20,
        "value": "ARDC Building 111 Queen St, PO Box 2000, Armstrong, Ontario P0T 1A0",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtOfficeAddress"
      },
      {
        "id": 1727904908807,
        "type": "TextField",
        "x": 66,
        "y": 53.333333333333336,
        "width": 518,
        "height": 20,
        "value": "Armstrong Courthouse",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtName"
      },
      {
        "id": 1727904922373,
        "type": "TextArea",
        "x": 50.666666666666664,
        "y": 159.33333333333334,
        "width": 385,
        "height": 62,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727904941402,
        "type": "TextArea",
        "x": 322.6666666666667,
        "y": 158.66666666666666,
        "width": 383,
        "height": 65,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727904953386,
        "type": "TextArea",
        "x": 52,
        "y": 249.33333333333334,
        "width": 380,
        "height": 65,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727904960955,
        "type": "TextArea",
        "x": 323.3333333333333,
        "y": 248.66666666666666,
        "width": 381,
        "height": 66,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727904969145,
        "type": "TextField",
        "x": 177.33333333333334,
        "y": 304,
        "width": 607,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727904977583,
        "type": "TextField",
        "x": 190,
        "y": 322,
        "width": 587,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 9,
        "type": "CheckBox",
        "x": 74.66666666666667,
        "y": 467.3333333333333,
        "width": 20,
        "height": 26,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 10,
        "type": "CheckBox",
        "x": 96,
        "y": 496,
        "width": 20,
        "height": 22,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 11,
        "type": "CheckBox",
        "x": 96,
        "y": 514,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 12,
        "type": "CheckBox",
        "x": 74.66666666666667,
        "y": 530,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 13,
        "type": "CheckBox",
        "x": 74.66666666666667,
        "y": 638,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1727905058627,
        "type": "TextField",
        "x": 90.66666666666667,
        "y": 546,
        "width": 738,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727905068214,
        "type": "TextField",
        "x": 232,
        "y": 564,
        "width": 528,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727905080152,
        "type": "TextField",
        "x": 137.33333333333334,
        "y": 581.3333333333334,
        "width": 668,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727905090294,
        "type": "TextField",
        "x": 304,
        "y": 600,
        "width": 418,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727905106455,
        "type": "TextField",
        "x": 92,
        "y": 653.3333333333334,
        "width": 266,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727905115838,
        "type": "TextField",
        "x": 364.6666666666667,
        "y": 653.3333333333334,
        "width": 326,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727905130644,
        "type": "TextField",
        "x": 306.6666666666667,
        "y": 671.3333333333334,
        "width": 412,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727905153419,
        "type": "TextField",
        "x": 440.6666666666667,
        "y": 51.333333333333336,
        "width": 150,
        "height": 20,
        "value": "court_info.courtFileNumber",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727905162967,
        "type": "TextField",
        "x": 440.6666666666667,
        "y": 40,
        "width": 150,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727905169942,
        "type": "TextField",
        "x": 440,
        "y": 40.666666666666664,
        "width": 150,
        "height": 20,
        "value": "court_info.courtFileNumber",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727905177331,
        "type": "TextField",
        "x": 441.3333333333333,
        "y": 40,
        "width": 150,
        "height": 20,
        "value": "court_info.courtFileNumber",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727905182708,
        "type": "TextArea",
        "x": 74,
        "y": 88.66666666666667,
        "width": 745,
        "height": 436,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1727905192283,
        "type": "TextArea",
        "x": 75.33333333333333,
        "y": 548,
        "width": 746,
        "height": 108,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1727905207848,
        "type": "TextField",
        "x": 184,
        "y": 645.3333333333334,
        "width": 323,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1727905217807,
        "type": "TextField",
        "x": 64,
        "y": 675.3333333333334,
        "width": 503,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1727905219622,
        "type": "TextField",
        "x": 68,
        "y": 704.6666666666666,
        "width": 176,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1727905220043,
        "type": "TextField",
        "x": 206.66666666666666,
        "y": 704.6666666666666,
        "width": 290,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1727905263014,
        "type": "TextField",
        "x": 226,
        "y": 118.66666666666667,
        "width": 350,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727905269851,
        "type": "TextField",
        "x": 284,
        "y": 150,
        "width": 262,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727905275582,
        "type": "TextField",
        "x": 321.3333333333333,
        "y": 181.33333333333334,
        "width": 278,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727905283508,
        "type": "TextField",
        "x": 336,
        "y": 213.33333333333334,
        "width": 203,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727905297105,
        "type": "TextField",
        "x": 398,
        "y": 244.66666666666666,
        "width": 145,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727905307396,
        "type": "TextField",
        "x": 516.6666666666666,
        "y": 244.66666666666666,
        "width": 86,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727905326575,
        "type": "TextArea",
        "x": 71.33333333333333,
        "y": 328,
        "width": 748,
        "height": 43,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727905337062,
        "type": "TextArea",
        "x": 70,
        "y": 412.6666666666667,
        "width": 747,
        "height": 37,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727905345242,
        "type": "TextArea",
        "x": 92,
        "y": 506,
        "width": 719,
        "height": 76,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727905353635,
        "type": "TextArea",
        "x": 92,
        "y": 583.3333333333334,
        "width": 720,
        "height": 76,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1727905363653,
        "type": "TextArea",
        "x": 92.66666666666667,
        "y": 665.3333333333334,
        "width": 723,
        "height": 66,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 44,
        "type": "CheckBox",
        "x": 91.33333333333333,
        "y": 184,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 45,
        "type": "CheckBox",
        "x": 90.66666666666667,
        "y": 214.66666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 46,
        "type": "CheckBox",
        "x": 70.66666666666667,
        "y": 295.3333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 47,
        "type": "CheckBox",
        "x": 70.66666666666667,
        "y": 311.3333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 48,
        "type": "CheckBox",
        "x": 70.66666666666667,
        "y": 376.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 49,
        "type": "CheckBox",
        "x": 70.66666666666667,
        "y": 394.6666666666667,
        "width": 20,
        "height": 25,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 50,
        "type": "CheckBox",
        "x": 91.33333333333333,
        "y": 476.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 51,
        "type": "CheckBox",
        "x": 90.66666666666667,
        "y": 562.6666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1727905590006,
        "type": "TextField",
        "x": 202.66666666666666,
        "y": 104,
        "width": 569,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 2,
        "type": "CheckBox",
        "x": 75.33333333333333,
        "y": 86.66666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 3,
        "type": "CheckBox",
        "x": 74.66666666666667,
        "y": 124,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1727905619448,
        "type": "TextArea",
        "x": 95.33333333333333,
        "y": 139.33333333333334,
        "width": 729,
        "height": 56,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727905628874,
        "type": "TextField",
        "x": 72,
        "y": 283.3333333333333,
        "width": 764,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727905642033,
        "type": "TextField",
        "x": 162,
        "y": 301.3333333333333,
        "width": 150,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727905648521,
        "type": "TextArea",
        "x": 76,
        "y": 479.3333333333333,
        "width": 755,
        "height": 159,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727905660349,
        "type": "TextField",
        "x": 104.66666666666667,
        "y": 660.6666666666666,
        "width": 174,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727905665113,
        "type": "TextField",
        "x": 434,
        "y": 626,
        "width": 221,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727905665300,
        "type": "TextField",
        "x": 313.3333333333333,
        "y": 608,
        "width": 215,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727905688189,
        "type": "TextField",
        "x": 311.3333333333333,
        "y": 678.6666666666666,
        "width": 222,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      }
    ]
  }

  if (formType === 'Form26B') {
    staticFields = [
      {
        "id": 1727938992613,
        "type": "TextField",
        "x": 66.66666666666667,
        "y": 87.33333333333333,
        "width": 464,
        "height": 20,
        "value": "court_info.courtOfficeAddress",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtOfficeAddress"
      },
      {
        "id": 1727939009291,
        "type": "TextField",
        "x": 66.66666666666667,
        "y": 53.333333333333336,
        "width": 465,
        "height": 20,
        "value": "court_info.courtName",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939041429,
        "type": "TextField",
        "x": 439.3333333333333,
        "y": 51.333333333333336,
        "width": 150,
        "height": 20,
        "value": "court_info.courtFileNumber",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727939054277,
        "type": "TextField",
        "x": 466,
        "y": 102,
        "width": 173,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939061889,
        "type": "TextArea",
        "x": 322.6666666666667,
        "y": 272,
        "width": 384,
        "height": 55,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 6,
        "type": "CheckBox",
        "x": 202.66666666666666,
        "y": 411.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 7,
        "type": "CheckBox",
        "x": 352,
        "y": 393.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 8,
        "type": "CheckBox",
        "x": 352.6666666666667,
        "y": 411.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1727939073215,
        "type": "TextArea",
        "x": 324,
        "y": 181.33333333333334,
        "width": 382,
        "height": 62,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939080954,
        "type": "TextArea",
        "x": 51.333333333333336,
        "y": 180.66666666666666,
        "width": 382,
        "height": 65,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939090036,
        "type": "TextArea",
        "x": 52,
        "y": 272,
        "width": 382,
        "height": 62,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939099172,
        "type": "TextField",
        "x": 178,
        "y": 326,
        "width": 606,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939106987,
        "type": "TextField",
        "x": 192.66666666666666,
        "y": 350,
        "width": 584,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 14,
        "type": "CheckBox",
        "x": 202.66666666666666,
        "y": 393.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1727939143587,
        "type": "TextField",
        "x": 266,
        "y": 485.3333333333333,
        "width": 86,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939143873,
        "type": "TextField",
        "x": 416,
        "y": 467.3333333333333,
        "width": 247,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939144142,
        "type": "TextField",
        "x": 150.66666666666666,
        "y": 468.6666666666667,
        "width": 245,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 18,
        "type": "CheckBox",
        "x": 86,
        "y": 530,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1727939173184,
        "type": "TextField",
        "x": 396.6666666666667,
        "y": 643.3333333333334,
        "width": 106,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939173541,
        "type": "TextField",
        "x": 366.6666666666667,
        "y": 624.6666666666666,
        "width": 105,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939197085,
        "type": "TextField",
        "x": 448,
        "y": 41.333333333333336,
        "width": 150,
        "height": 20,
        "value": "court_info.courtFileNumber",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727939208262,
        "type": "TextField",
        "x": 188,
        "y": 130,
        "width": 330,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727939215117,
        "type": "TextField",
        "x": 64,
        "y": 160.66666666666666,
        "width": 515,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727939225367,
        "type": "TextField",
        "x": 66,
        "y": 192.66666666666666,
        "width": 205,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      }
    ]
  }

  if (formType === 'Form25A') {
    staticFields = [
      {
        "id": 1727939471271,
        "type": "TextField",
        "x": 435.3333333333333,
        "y": 30.666666666666668,
        "width": 150,
        "height": 20,
        "value": "court_info.courtFileNumber",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727939488230,
        "type": "TextField",
        "x": 435.3333333333333,
        "y": 63.333333333333336,
        "width": 150,
        "height": 20,
        "value": "court_info.courtFileNumber",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727939501250,
        "type": "TextField",
        "x": 159.33333333333334,
        "y": 94.66666666666667,
        "width": "396",
        "height": "20",
        "value": "court_info.courtOfficeAddress",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtOfficeAddress"
      },
      {
        "id": 1727939501716,
        "type": "TextField",
        "x": 160,
        "y": 64,
        "width": 396,
        "height": 20,
        "value": "court_info.courtName",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtName"
      },
      {
        "id": 1727939570546,
        "type": "TextField",
        "x": 19.333333333333332,
        "y": 282.6666666666667,
        "width": 180,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939571294,
        "type": "TextField",
        "x": 19.333333333333332,
        "y": 177.33333333333334,
        "width": 181,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939584787,
        "type": "TextArea",
        "x": 149.33333333333334,
        "y": 194,
        "width": 319,
        "height": 35,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939585402,
        "type": "TextArea",
        "x": 149.33333333333334,
        "y": 220.66666666666666,
        "width": 319,
        "height": 35,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939585851,
        "type": "TextArea",
        "x": 149.33333333333334,
        "y": 300.6666666666667,
        "width": 319,
        "height": 34,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939586579,
        "type": "TextArea",
        "x": 150,
        "y": 326,
        "width": 316,
        "height": 35,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939587225,
        "type": "TextArea",
        "x": 379.3333333333333,
        "y": 193.33333333333334,
        "width": 320,
        "height": 36,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939587599,
        "type": "TextArea",
        "x": 380,
        "y": 220,
        "width": 318,
        "height": 36,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939587944,
        "type": "TextArea",
        "x": 380.6666666666667,
        "y": 300,
        "width": 315,
        "height": 34,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939588305,
        "type": "TextArea",
        "x": 381.3333333333333,
        "y": 326,
        "width": 314,
        "height": 32,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939653901,
        "type": "TextField",
        "x": 223.33333333333334,
        "y": 354.6666666666667,
        "width": 558,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939660687,
        "type": "TextField",
        "x": 18,
        "y": 436.6666666666667,
        "width": 865,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939662188,
        "type": "TextField",
        "x": 59.333333333333336,
        "y": 394,
        "width": 802,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939663323,
        "type": "TextField",
        "x": 17.333333333333332,
        "y": 372,
        "width": 866,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939684658,
        "type": "TextField",
        "x": 241.33333333333334,
        "y": 546,
        "width": 529,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939684987,
        "type": "TextField",
        "x": 234.66666666666666,
        "y": 525.3333333333334,
        "width": 539,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939689578,
        "type": "TextField",
        "x": 18.666666666666668,
        "y": 488,
        "width": 863,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939689749,
        "type": "TextField",
        "x": 17.333333333333332,
        "y": 456,
        "width": 865,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939716151,
        "type": "TextField",
        "x": 160.66666666666666,
        "y": 564,
        "width": 649,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939725061,
        "type": "TextArea",
        "x": 42,
        "y": 612.6666666666666,
        "width": 811,
        "height": 177,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939740046,
        "type": "TextField",
        "x": 18.666666666666668,
        "y": 686.6666666666666,
        "width": 412,
        "height": 20,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727939752436,
        "type": "TextArea",
        "x": 22.666666666666668,
        "y": 70.66666666666667,
        "width": 842,
        "height": 849,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      }
    ]
  }

  if (formType === 'Form25') {
    staticFields = [
      {
        "id": 1727939471271,
        "type": "TextField",
        "x": 440,
        "y": 38.666666666666664,
        "width": 150,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727939488230,
        "type": "TextField",
        "x": 438.6666666666667,
        "y": 51.333333333333336,
        "width": 150,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727939501250,
        "type": "TextField",
        "x": 146,
        "y": 87.33333333333333,
        "width": 418,
        "height": 20,
        "value": "ARDC Building 111 Queen St, PO Box 2000, Armstrong, Ontario P0T 1A0",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtOfficeAddress"
      },
      {
        "id": 1727939501716,
        "type": "TextField",
        "x": 148,
        "y": 53.333333333333336,
        "width": 416,
        "height": 20,
        "value": "Armstrong Courthouse",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtName"
      },
      {
        "id": 1727939570546,
        "type": "TextField",
        "x": 48,
        "y": 264.6666666666667,
        "width": 165,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939571294,
        "type": "TextField",
        "x": 48,
        "y": 214,
        "width": 166,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939584787,
        "type": "TextArea",
        "x": 165.33333333333334,
        "y": 182,
        "width": 299,
        "height": 65,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939585851,
        "type": "TextArea",
        "x": 167.33333333333334,
        "y": 282,
        "width": 296,
        "height": 63,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939587225,
        "type": "TextArea",
        "x": 380.6666666666667,
        "y": 182.66666666666666,
        "width": 298,
        "height": 64,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939587944,
        "type": "TextArea",
        "x": 381.3333333333333,
        "y": 282,
        "width": 296,
        "height": 63,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939653901,
        "type": "TextField",
        "x": 48.666666666666664,
        "y": 373.3333333333333,
        "width": 800,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939662188,
        "type": "TextField",
        "x": 48.666666666666664,
        "y": 438.6666666666667,
        "width": 802,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939663323,
        "type": "TextField",
        "x": 48.666666666666664,
        "y": 407.3333333333333,
        "width": 798,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727939740046,
        "type": "TextField",
        "x": 48.666666666666664,
        "y": 705.3333333333334,
        "width": 367,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727939752436,
        "type": "TextArea",
        "x": 48,
        "y": 67.33333333333333,
        "width": 800,
        "height": 849,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 23,
        "type": "CheckBox",
        "x": 55.333333333333336,
        "y": 334.6666666666667,
        "width": 20,
        "height": 23,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1727940283222,
        "type": "TextArea",
        "x": 52,
        "y": 475.3333333333333,
        "width": 798,
        "height": 50,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727940293391,
        "type": "TextArea",
        "x": 53.333333333333336,
        "y": 526.6666666666666,
        "width": 796,
        "height": 44,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727940304228,
        "type": "TextArea",
        "x": 54,
        "y": 577.3333333333334,
        "width": 796,
        "height": 256,
        "value": "New Dynamic TextArea",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 20,
        "type": "CheckBox",
        "x": 465.3333333333333,
        "y": 104.66666666666667,
        "width": "20",
        "height": "20",
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 21,
        "type": "CheckBox",
        "x": 465.3333333333333,
        "y": 118,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      }
    ]
  }

  if (formType === 'Form23') {
    staticFields = [
      {
        "id": 1727940642085,
        "type": "TextField",
        "x": 434.6666666666667,
        "y": 49.333333333333336,
        "width": 234,
        "height": 20,
        "value": "RW- 001 ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727940642277,
        "type": "TextField",
        "x": 32.666666666666664,
        "y": 77.33333333333333,
        "width": 397,
        "height": 20,
        "value": "ARDC Building 111 Queen St, PO Box 2000, Armstrong, Ontario P0T 1A0",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtOfficeAddress"
      },
      {
        "id": 1727940642547,
        "type": "TextField",
        "x": 33.333333333333336,
        "y": 49.333333333333336,
        "width": 396,
        "height": 20,
        "value": "Armstrong Courthouse",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": ""
      },
      {
        "id": 1727940667749,
        "type": "TextArea",
        "x": 20.666666666666668,
        "y": 195.33333333333334,
        "width": "413",
        "height": "35",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.phoneAndFax, applicant.email"
      },
      {
        "id": 1727940668101,
        "type": "TextArea",
        "x": 20,
        "y": 262.6666666666667,
        "width": "413",
        "height": "35",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondent.fullLegalName, respondent.address, respondent.municipality"
      },
      {
        "id": 1727940668483,
        "type": "TextArea",
        "x": 20,
        "y": 288,
        "width": "413",
        "height": "35",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondent.phoneAndFax, respondent.email"
      },
      {
        "id": 1727940669015,
        "type": "TextArea",
        "x": 318,
        "y": 289.3333333333333,
        "width": "413",
        "height": "35",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondentsLawyer.phoneAndFax, respondentsLawyer.email"
      },
      {
        "id": 1727940670439,
        "type": "TextArea",
        "x": 317.3333333333333,
        "y": 262,
        "width": "413",
        "height": "35",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondentsLawyer.fullLegalName, respondentsLawyer.address"
      },
      {
        "id": 1727940670666,
        "type": "TextArea",
        "x": 317.3333333333333,
        "y": 194.66666666666666,
        "width": "413",
        "height": "35",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicantsLawyer.phoneAndFax, applicantsLawyer.email"
      },
      {
        "id": 1727940670875,
        "type": "TextArea",
        "x": 316.6666666666667,
        "y": 168.66666666666666,
        "width": "413",
        "height": "35",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicantsLawyer.fullLegalName, applicantsLawyer.address"
      },
      {
        "id": 1727940671183,
        "type": "TextArea",
        "x": 20,
        "y": 167.66666666666666,
        "width": 413,
        "height": "35",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.fullLegalName, applicant.address, applicant.municipality"
      },
      {
        "id": 1727940808406,
        "type": "TextField",
        "x": 400.6666666666667,
        "y": 422,
        "width": 106,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727940808729,
        "type": "TextField",
        "x": 78,
        "y": 422.6666666666667,
        "width": 448,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727940809020,
        "type": "TextField",
        "x": 239.33333333333334,
        "y": 404.6666666666667,
        "width": 532,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727940809305,
        "type": "TextField",
        "x": 244.66666666666666,
        "y": 354.6666666666667,
        "width": 526,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727940809598,
        "type": "TextField",
        "x": 148.66666666666666,
        "y": 332.6666666666667,
        "width": 668,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727940843602,
        "type": "TextField",
        "x": 295.3333333333333,
        "y": 520,
        "width": 91,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727940857200,
        "type": "TextField",
        "x": 306,
        "y": 594.6666666666666,
        "width": 165,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727940857469,
        "type": "TextField",
        "x": 306.6666666666667,
        "y": 574.6666666666666,
        "width": 162,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727940857740,
        "type": "TextField",
        "x": 304.6666666666667,
        "y": 557.3333333333334,
        "width": 165,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727940858002,
        "type": "TextField",
        "x": 305.3333333333333,
        "y": 538.6666666666666,
        "width": 163,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727940858256,
        "type": "TextField",
        "x": 161.33333333333334,
        "y": 555.3333333333334,
        "width": 106,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727940858543,
        "type": "TextField",
        "x": 180,
        "y": 538.6666666666666,
        "width": 108,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727940891138,
        "type": "TextField",
        "x": 34,
        "y": 464.6666666666667,
        "width": 841,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727940899619,
        "type": "TextField",
        "x": 20,
        "y": 675.3333333333334,
        "width": 423,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727940912009,
        "type": "TextField",
        "x": 434.6666666666667,
        "y": 31.333333333333332,
        "width": 150,
        "height": "20",
        "value": "RW- 001 ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727940934675,
        "type": "TextArea",
        "x": 22,
        "y": 82,
        "width": 850,
        "height": 796,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727940948242,
        "type": "TextArea",
        "x": 154.66666666666666,
        "y": 658.6666666666666,
        "width": 649,
        "height": 131,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      }
    ]
  }

  if (formType === 'Form14') {
    staticFields = [
      {
        "id": 1727941149478,
        "type": "TextField",
        "x": 438.6666666666667,
        "y": 38,
        "width": 150,
        "height": 20,
        "value": "RW- 001 ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727941173280,
        "type": "TextField",
        "x": 66,
        "y": 52,
        "width": 518,
        "height": 20,
        "value": "Armstrong Courthouse",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtName"
      },
      {
        "id": 1727941173596,
        "type": "TextField",
        "x": 66.66666666666667,
        "y": 81.33333333333333,
        "width": 513,
        "height": 20,
        "value": "ARDC Building 111 Queen St, PO Box 2000, Armstrong, Ontario P0T 1A0",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtOfficeAddress"
      },
      {
        "id": 1727941185341,
        "type": "TextField",
        "x": 438,
        "y": 50,
        "width": 150,
        "height": 20,
        "value": "RW- 001 ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727941188460,
        "type": "TextArea",
        "x": 51.333333333333336,
        "y": 155.33333333333334,
        "width": "380",
        "height": 63,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.fullLegalName,applicant.address,applicant.municipality,applicant.phoneAndFax,applicant.email"
      },
      {
        "id": 1727941189534,
        "type": "TextArea",
        "x": 52,
        "y": 246,
        "width": "380",
        "height": "64",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondent.fullLegalName,respondent.address,respondent.municipality,respondent.phoneAndFax,respondent.email"
      },
      {
        "id": 1727941189721,
        "type": "TextArea",
        "x": 326,
        "y": 155.33333333333334,
        "width": "380",
        "height": "64",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicantsLawyer.fullLegalName,applicantsLawyer.address,applicantsLawyer.municipality,applicantsLawyer.phoneAndFax,applicant.email"
      },
      {
        "id": 1727941190748,
        "type": "TextArea",
        "x": 326,
        "y": 245.33333333333334,
        "width": "380",
        "height": "64",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondentsLawyer.fullLegalName,respondentsLawyer.address,respondentsLawyer.municipality,respondentsLawyer.phoneAndFax,respondentsLawyer.email"
      },
      {
        "id": 1727941235855,
        "type": "TextField",
        "x": 176.66666666666666,
        "y": 333.3333333333333,
        "width": 186,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727941236064,
        "type": "TextField",
        "x": 374.6666666666667,
        "y": 315.3333333333333,
        "width": 309,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727941251792,
        "type": "TextField",
        "x": 326.6666666666667,
        "y": 382.6666666666667,
        "width": 381,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 13,
        "type": "CheckBox",
        "x": 52,
        "y": 428.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 14,
        "type": "CheckBox",
        "x": 51.333333333333336,
        "y": 414.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1727941270478,
        "type": "TextField",
        "x": 49.333333333333336,
        "y": 583.3333333333334,
        "width": 385,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728211854373,
        "type": "TextArea",
        "x": 56,
        "y": 94,
        "width": 764,
        "height": 800,
        "value": "New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      }
    ]
  }

  if (formType === 'Form14A') {
    staticFields = [
      {
        "id": 1727941329592,
        "type": "TextField",
        "x": 434.6666666666667,
        "y": 116,
        "width": 235,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727941329892,
        "type": "TextField",
        "x": 434.6666666666667,
        "y": 66,
        "width": 150,
        "height": 20,
        "value": "RW- 001 ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1727941330222,
        "type": "TextField",
        "x": 32.666666666666664,
        "y": 90.66666666666667,
        "width": 506,
        "height": 20,
        "value": "ARDC Building 111 Queen St, PO Box 2000, Armstrong, Ontario P0T 1A0",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtOfficeAddress"
      },
      {
        "id": 1727941330619,
        "type": "TextField",
        "x": 34,
        "y": 62.666666666666664,
        "width": 505,
        "height": 20,
        "value": "Armstrong Courthouse",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtName"
      },
      {
        "id": 1727941356233,
        "type": "TextArea",
        "x": 20,
        "y": 295.3333333333333,
        "width": "411",
        "height": "35",
        "value": "respondent.municipality,respondent.phoneAndFax,respondent.email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondent.municipality,respondent.phoneAndFax,respondent.email"
      },
      {
        "id": 1727941356562,
        "type": "TextArea",
        "x": 20,
        "y": 174,
        "width": 411,
        "height": "35",
        "value": "applicant.fullLegalName,applicant.address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.fullLegalName,applicant.address"
      },
      {
        "id": 1727941368571,
        "type": "TextArea",
        "x": 20,
        "y": 200.66666666666666,
        "width": "411",
        "height": "35",
        "value": "Adelaide-Metcalfe, Township of, (647)726-0053, Ron@gmail.com",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.municipality,applicant.phoneAndFax,applicant.email"
      },
      {
        "id": 1727941368937,
        "type": "TextArea",
        "x": 20,
        "y": 269.3333333333333,
        "width": "411",
        "height": "35",
        "value": "respondent.fullLegalName,respondent.address,",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondent.fullLegalName,respondent.address"
      },
      {
        "id": 1727941369396,
        "type": "TextArea",
        "x": 317.3333333333333,
        "y": 295.3333333333333,
        "width": "411",
        "height": "35",
        "value": "respondentsLawyer.municipality,respondentsLawyer.phoneAndFax,respondentsLawyer.email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondentsLawyer.municipality,respondentsLawyer.phoneAndFax,respondentsLawyer.email"
      },
      {
        "id": 1727941369770,
        "type": "TextArea",
        "x": 317.3333333333333,
        "y": 268.6666666666667,
        "width": "411",
        "height": "35",
        "value": "respondentsLawyer.fullLegalName,respondentsLawyer.address,",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondentsLawyer.fullLegalName,respondentsLawyer.address"
      },
      {
        "id": 1727941370273,
        "type": "TextArea",
        "x": 317.3333333333333,
        "y": 201.33333333333334,
        "width": "411",
        "height": "35",
        "value": "applicantsLawyer.municipality,applicantsLawyer.phoneAndFax,applicant.email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicantsLawyer.municipality,applicantsLawyer.phoneAndFax,applicant.email"
      },
      {
        "id": 1727941370603,
        "type": "TextArea",
        "x": 317.3333333333333,
        "y": 174.66666666666666,
        "width": "411",
        "height": "35",
        "value": "applicantsLawyer.fullLegalName,applicantsLawyer.address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicantsLawyer.fullLegalName,applicantsLawyer.address"
      },
      {
        "id": 1727941453269,
        "type": "TextField",
        "x": 142.66666666666666,
        "y": 337.3333333333333,
        "width": 678,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.fullLegalName"
      },
      {
        "id": 1727941465194,
        "type": "TextField",
        "x": 156.66666666666666,
        "y": 357.3333333333333,
        "width": 656,
        "height": 20,
        "value": "applicant.address,applicant.municipality",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.address,applicant.municipality"
      },
      {
        "id": 1727941478148,
        "type": "TextArea",
        "x": 30.666666666666668,
        "y": 436,
        "width": 832,
        "height": 479,
        "value": "Lorem ipsum odor amet, consectetuer adipiscing elit. Commodo pellentesque orci augue; mollis ex purus. Elit lectus class ad consectetur pulvinar inceptos a praesent penatibus. Pretium scelerisque cubilia, magna volutpat placerat mattis fringilla. Vel tempor donec ex lectus neque velit a aliquam nascetur. Habitant turpis ad amet sociosqu aenean cursus.\n\nHimenaeos urna enim at vehicula orci accumsan erat in. Ac massa ut nisl accumsan mattis neque magnis. Tempus at consectetur cras phasellus tempor. Vulputate lobortis molestie; tincidunt molestie ridiculus sem duis habitant vehicula. Ultricies habitasse est pellentesque justo nulla fermentum inceptos fames. Penatibus feugiat tortor taciti; accumsan nascetur tellus. Malesuada fusce ligula, scelerisque dapibus conubia sagittis pharetra.\n\nCurabitur pretium massa cubilia sodales maximus suspendisse felis montes maecenas. Habitasse velit urna netus euismod litora commodo hac. Ornare semper molestie feugiat pulvinar quis ex ornare. Pellentesque maximus ultrices blandit, maecenas nibh nulla. Mollis pretium accumsan a nullam feugiat convallis? Facilisis iaculis laoreet tempus torquent neque, risus quisque. Tellus taciti tincidunt vehicula blandit molestie faucibus? Venenatis fames potenti diam dignissim, sed tortor pellentesque. Mauris quisque dis condimentum volutpat scelerisque.\n\nDonec varius vivamus montes magna magnis fermentum. Sit dis ante ad lobortis dictum sed. Montes mattis habitasse inceptos dis nisi sagittis congue. Dis ridiculus urna faucibus metus luctus ipsum. Faucibus bibendum donec, venenatis euismod fringilla mi. Mattis himenaeos purus dictumst at maecenas. Massa interdum neque enim ex adipiscing nascetur.\n\nFringilla eros platea nec litora inceptos nam dictumst. Arcu elementum duis neque id, est curabitur quis. Ex imperdiet conubia habitant; nec et metus mus. Sit massa vulputate est curabitur tortor. Lectus elit penatibus maecenas feugiat; inceptos curabitur sapien aliquet. Iaculis gravida nostra parturient senectus est nisl montes. Feugiat accumsan odio gravida ad pharetra penatibus amet convallis. Ac quis mauris aptent risus, congue suscipit lacus sagittis. Gravida semper nunc aenean nunc leo faucibus diam id. Nisl dolor malesuada eros consequat adipiscing ridiculus.\n\nDonec amet nostra dictum sed lobortis, maximus nulla iaculis. Nullam pharetra tempus vel montes ante; arcu tellus. Ipsum maecenas sed arcu montes conubia sociosqu vel augue nisl. Curabitur scelerisque nullam varius fusce justo. Cubilia felis porttitor neque odio ullamcorper. Risus cubilia sapien ipsum a sodales ante consequat.\n\nAugue elit fringilla interdum habitant, erat suscipit primis ultrices. Nascetur class torquent litora euismod eleifend sem etiam fusce semper. Curabitur potenti sagittis ad commodo mauris. Semper commodo inceptos arcu risus enim cubilia. Nunc vivamus ultrices porta facilisi lorem fermentum sagittis. Dapibus elementum dolor libero adipiscing dis elit dignissim ex tristique. Conubia nisi lacus magnis commodo luctus gravida. Curabitur mi fusce mattis aliquet dis natoque etiam; curabitur aliquet. Diam nam habitasse congue feugiat rhoncus dictum.",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1727941492314,
        "type": "TextField",
        "x": 435.3333333333333,
        "y": 33.333333333333336,
        "width": 150,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727941492636,
        "type": "TextField",
        "x": 188.66666666666666,
        "y": 22.666666666666668,
        "width": 127,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727941543990,
        "type": "TextField",
        "x": 149.33333333333334,
        "y": 602,
        "width": 387,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727941544289,
        "type": "TextField",
        "x": 34.666666666666664,
        "y": 630.6666666666666,
        "width": 558,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727941544875,
        "type": "TextField",
        "x": 34,
        "y": 659.3333333333334,
        "width": 196,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1727941548175,
        "type": "TextField",
        "x": 176,
        "y": 659.3333333333334,
        "width": 345,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      }
    ]
  }

  if (formType === 'Form14B') {
    staticFields = [
      {
        "id": 1728043914441,
        "type": "TextField",
        "x": 426.6666666666667,
        "y": 52,
        "width": 219,
        "height": 20,
        "value": "court_info.courtFileNumber",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1728044019539,
        "type": "TextField",
        "x": 44.666666666666664,
        "y": 52.666666666666664,
        "width": 541,
        "height": 20,
        "value": "court_info.courtName",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtName"
      },
      {
        "id": 1728044057970,
        "type": "TextField",
        "x": 60,
        "y": 83.33333333333333,
        "width": 518,
        "height": 20,
        "value": "court_info.courtOfficeAddress",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtOfficeAddress"
      },
      {
        "id": 4,
        "type": "CheckBox",
        "x": 46.666666666666664,
        "y": 134,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 5,
        "type": "CheckBox",
        "x": 206.66666666666666,
        "y": 133.33333333333334,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1728044109199,
        "type": "TextField",
        "x": 96.66666666666667,
        "y": 178.66666666666666,
        "width": 307,
        "height": 20,
        "value": "applicant.fullLegalName",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.fullLegalName"
      },
      {
        "id": 1728044137675,
        "type": "TextField",
        "x": 370.6666666666667,
        "y": 179.33333333333334,
        "width": 309,
        "height": 20,
        "value": "respondent.fullLegalName",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondent.fullLegalName"
      },
      {
        "id": 1728044191664,
        "type": "TextField",
        "x": 214,
        "y": 203.33333333333334,
        "width": 230,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728044278049,
        "type": "TextField",
        "x": 245.33333333333334,
        "y": 226.66666666666666,
        "width": 388,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 10,
        "type": "CheckBox",
        "x": 46.666666666666664,
        "y": 278,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 11,
        "type": "CheckBox",
        "x": 134,
        "y": 278,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 12,
        "type": "CheckBox",
        "x": 230.66666666666666,
        "y": 278,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 13,
        "type": "CheckBox",
        "x": 46.666666666666664,
        "y": 318,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 14,
        "type": "CheckBox",
        "x": 46,
        "y": 345.3333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 15,
        "type": "CheckBox",
        "x": 333.3333333333333,
        "y": 319.3333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1728044558443,
        "type": "TextField",
        "x": 431.3333333333333,
        "y": 318.6666768391927,
        "width": 210,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728044631170,
        "type": "TextArea",
        "x": 46,
        "y": 87.33333905537923,
        "width": 793,
        "height": 669,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728044681858,
        "type": "TextField",
        "x": 434.6666666666667,
        "y": 41.333333333333336,
        "width": 209,
        "height": 20,
        "value": "court_info.courtFileNumber",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1728044725434,
        "type": "TextArea",
        "x": 46,
        "y": 573.3332722981771,
        "width": 792,
        "height": 261,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728044944486,
        "type": "TextField",
        "x": 433.3333333333333,
        "y": 40,
        "width": 210,
        "height": 20,
        "value": "court_info.courtFileNumber",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1728044998563,
        "type": "TextField",
        "x": 316,
        "y": 270.00002034505206,
        "width": 391,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728045020948,
        "type": "TextArea",
        "x": 44.666666666666664,
        "y": 121.33333333333333,
        "width": 392,
        "height": 193,
        "value": "applicantsLawyer.fullLegalName,applicantsLawyer.address,applicantsLawyer.municipality,applicantsLawyer.phoneAndFax,applicant.email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "applicantsLawyer.fullLegalName,applicantsLawyer.address,applicantsLawyer.municipality,applicantsLawyer.phoneAndFax,applicant.email"
      },
      {
        "id": 1728045158167,
        "type": "TextArea",
        "x": 314,
        "y": 121.33333333333333,
        "width": 392,
        "height": 193,
        "value": "respondentsLawyer.fullLegalName,respondentsLawyer.address,respondentsLawyer.municipality,respondentsLawyer.phoneAndFax,respondentsLawyer.email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "respondentsLawyer.fullLegalName,respondentsLawyer.address,respondentsLawyer.municipality,respondentsLawyer.phoneAndFax,respondentsLawyer.email"
      }
    ]
  }

  if (formType === 'Form14C') {
    staticFields = [
      {
        "id": 1728043973061,
        "type": "TextField",
        "x": 439.3333333333333,
        "y": 53.333333333333336,
        "width": 208,
        "height": 20,
        "value": "RW- 001 ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1728043987401,
        "type": "TextField",
        "x": 122.66666666666667,
        "y": 54,
        "width": 288,
        "height": 20,
        "value": "Armstrong Courthouse",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtName"
      },
      {
        "id": 1728043998581,
        "type": "TextField",
        "x": 64.66666666666667,
        "y": 84,
        "width": 526,
        "height": 20,
        "value": "ARDC Building 111 Queen St, PO Box 2000, Armstrong, Ontario P0T 1A0",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtOfficeAddress"
      },
      {
        "id": 1728044024697,
        "type": "TextArea",
        "x": 49.333333333333336,
        "y": 160.6666514078776,
        "width": "380",
        "height": 63,
        "value": "Ronald Weasley , Suite 448 2179 Kasie Curve, South Frediamouth, AK 33028, Adelaide-Metcalfe, Township of, (647)726-0053, Ron@gmail.com",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.fullLegalName,applicant.address,applicant.municipality,applicant.phoneAndFax,applicant.email"
      },
      {
        "id": 1728044115905,
        "type": "TextArea",
        "x": 50,
        "y": 254.00000699361166,
        "width": "380",
        "height": 63,
        "value": "respondentsLawyer.fullLegalName,respondentsLawyer.address,respondentsLawyer.municipality,respondentsLawyer.phoneAndFax,respondentsLawyer.email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondent.fullLegalName,respondent.address,respondent.municipality,respondent.phoneAndFax,respondent.email"
      },
      {
        "id": 1728044147705,
        "type": "TextArea",
        "x": 322,
        "y": 160.6666514078776,
        "width": "380",
        "height": 63,
        "value": "Albus Dumbledore, Diagon Alley , , (647)726-0053, Ron@gmail.com",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicantsLawyer.fullLegalName,applicantsLawyer.address,applicantsLawyer.municipality,applicantsLawyer.phoneAndFax,applicant.email"
      },
      {
        "id": 1728044179853,
        "type": "TextArea",
        "x": 321.3333333333333,
        "y": 253.33333333333334,
        "width": "380",
        "height": 64,
        "value": "respondentsLawyer.fullLegalName,respondentsLawyer.address,respondentsLawyer.municipality,respondentsLawyer.phoneAndFax,respondentsLawyer.email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondentsLawyer.fullLegalName,respondentsLawyer.address,respondentsLawyer.municipality,respondentsLawyer.phoneAndFax,respondentsLawyer.email"
      },
      {
        "id": 1728044210260,
        "type": "TextArea",
        "x": 50,
        "y": 338.6666768391927,
        "width": 795,
        "height": 64,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 9,
        "type": "CheckBox",
        "x": 121.33333333333333,
        "y": 448.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 10,
        "type": "CheckBox",
        "x": 121.33333333333333,
        "y": 410,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 11,
        "type": "CheckBox",
        "x": 121.33333333333333,
        "y": 429.3333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 12,
        "type": "CheckBox",
        "x": 73.33333333333333,
        "y": 515.3333333333334,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 13,
        "type": "CheckBox",
        "x": 73.33333333333333,
        "y": 496.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 14,
        "type": "CheckBox",
        "x": 274.6666666666667,
        "y": 428,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 15,
        "type": "CheckBox",
        "x": 72.66666666666667,
        "y": 688,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 16,
        "type": "CheckBox",
        "x": 72.66666666666667,
        "y": 668.6666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 17,
        "type": "CheckBox",
        "x": 490,
        "y": 629.3333333333334,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 18,
        "type": "CheckBox",
        "x": 528,
        "y": 629.3333333333334,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1728044647596,
        "type": "TextField",
        "x": 304,
        "y": 630.4444580078125,
        "width": 184,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728044649527,
        "type": "TextField",
        "x": 304.6666666666667,
        "y": 666.0000203450521,
        "width": 403,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728044650140,
        "type": "TextField",
        "x": 234.66666666666666,
        "y": 408.66668701171875,
        "width": 520,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728044650412,
        "type": "TextField",
        "x": 192,
        "y": 391.33335367838544,
        "width": 584,
        "height": 20,
        "value": "Ronald Weasley ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.fullLegalName"
      },
      {
        "id": 1728044673072,
        "type": "TextField",
        "x": 202,
        "y": 445.55556233723956,
        "width": 567,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728044673412,
        "type": "TextField",
        "x": 442.6666666666667,
        "y": 630.6666666666666,
        "width": 63,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728044716560,
        "type": "TextArea",
        "x": 88.66666666666667,
        "y": 527.5555623372396,
        "width": 733,
        "height": 70,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728044796636,
        "type": "TextField",
        "x": 414,
        "y": 429.33335367838544,
        "width": 249,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728044919247,
        "type": "TextField",
        "x": 439.3333333333333,
        "y": 41.33330281575521,
        "width": 209,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728044932927,
        "type": "TextField",
        "x": 301.3333333333333,
        "y": 74,
        "width": 150,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728044938256,
        "type": "TextField",
        "x": 252.66666666666666,
        "y": 147.99996948242188,
        "width": 170,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728044944735,
        "type": "TextField",
        "x": 422.6666666666667,
        "y": 147.99996948242188,
        "width": 236,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728044984064,
        "type": "TextArea",
        "x": 87.33333333333333,
        "y": 179.99997647603354,
        "width": 728,
        "height": 56,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 32,
        "type": "CheckBox",
        "x": 68.66666666666667,
        "y": 115.33333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 33,
        "type": "CheckBox",
        "x": 68,
        "y": 134,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 34,
        "type": "CheckBox",
        "x": 68,
        "y": 150.66666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 35,
        "type": "CheckBox",
        "x": 68.66666666666667,
        "y": 221.33333333333334,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1728045035613,
        "type": "TextArea",
        "x": 87.33333333333333,
        "y": 254.00000699361166,
        "width": 735,
        "height": 63,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728045057191,
        "type": "TextField",
        "x": 311.3333333333333,
        "y": 219.33334032694498,
        "width": 162,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728045079719,
        "type": "TextField",
        "x": 159.33333333333334,
        "y": 237.33334032694498,
        "width": 281,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728045113248,
        "type": "TextField",
        "x": 189.33333333333334,
        "y": 469.33335367838544,
        "width": 73,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728045117096,
        "type": "TextField",
        "x": 79,
        "y": 372.6666666666667,
        "width": "742",
        "height": "17",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728045117624,
        "type": "TextField",
        "x": 79,
        "y": 360,
        "width": 742,
        "height": 17,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728045118056,
        "type": "TextField",
        "x": 79,
        "y": 348,
        "width": "742",
        "height": 17,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728045118416,
        "type": "TextField",
        "x": 79,
        "y": 323.3333435058594,
        "width": "742",
        "height": "17",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728045118788,
        "type": "TextField",
        "x": 79,
        "y": 310.00001017252606,
        "width": 742,
        "height": "17",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728045153316,
        "type": "TextField",
        "x": 79,
        "y": 336,
        "width": "742",
        "height": "17",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 46,
        "type": "CheckBox",
        "x": 68.66666666666667,
        "y": 392.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1728045377963,
        "type": "TextArea",
        "x": 69.33333333333333,
        "y": 424.88889567057294,
        "width": 767,
        "height": 63,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728045422243,
        "type": "TextArea",
        "x": 404.6666666666667,
        "y": 386,
        "width": 150,
        "height": 25,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728045462163,
        "type": "TextField",
        "x": 334.6666666666667,
        "y": 470.00002034505206,
        "width": 74,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728045474587,
        "type": "TextField",
        "x": 481.3333333333333,
        "y": 470.22222900390625,
        "width": 72,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728045537218,
        "type": "TextField",
        "x": 102.66666666666667,
        "y": 567.7777913411459,
        "width": 210,
        "height": 21,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      }
    ]
  }


  if (formType === 'Form17A') {
    staticFields = [
      {
        "id": 1728014638416,
        "type": "TextField",
        "x": 431.3333333333333,
        "y": 50.666666666666664,
        "width": 224,
        "height": 20,
        "value": "Court File Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728014665363,
        "type": "TextField",
        "x": 99.33333333333333,
        "y": 45.333333333333336,
        "width": 438,
        "height": 25,
        "value": "Name of court",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728014765603,
        "type": "TextArea",
        "x": 60,
        "y": 79.33333333333333,
        "width": 518,
        "height": 22,
        "value": "Court office address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728014837799,
        "type": "TextField",
        "x": 45.333333333333336,
        "y": 136,
        "width": 375,
        "height": 49,
        "value": "Name of party filing this brief",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728014865855,
        "type": "TextField",
        "x": 326,
        "y": 135.33333333333334,
        "width": 386,
        "height": 52,
        "value": "Date of case conference",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728015005419,
        "type": "TextArea",
        "x": 44.666666666666664,
        "y": 214.66667366027832,
        "width": 385,
        "height": 62,
        "value": "Applicant(s) \nFull legal name & address for service - street & number, municipality, postal code, telephone & fax numbers and e-email address (if any)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728015082639,
        "type": "TextArea",
        "x": 322.6666666666667,
        "y": 215.33334032694498,
        "width": 393,
        "height": 61,
        "value": "Applicant(s)\nLawyer's name & address - street & number, municipality, postal code, telephone & fax number and e-mail address (if any)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728015154143,
        "type": "TextArea",
        "x": 322,
        "y": 301.333340326945,
        "width": 394,
        "height": 62,
        "value": "Respondent(s)\nLawyer's name & address - street & number, municipality, postal code, telephone & fax number and e-mail address (if any)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728015181598,
        "type": "TextArea",
        "x": 44,
        "y": 301.333340326945,
        "width": 386,
        "height": 62,
        "value": "Respondent(s) \nFull legal name & address for service - street & number, municipality, postal code, telephone & fax numbers and e-email address (if any)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728015224714,
        "type": "TextArea",
        "x": 44,
        "y": 380.6666564941406,
        "width": 812,
        "height": 62,
        "value": "Name & address of Children's Lawyer's agent (Street & number, municipality, postal code, telephone & fax numbers and e-email address (if any) and name of person represented.",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728015358447,
        "type": "TextField",
        "x": 202,
        "y": 450.22222391764325,
        "width": 80,
        "height": 19,
        "value": "Applicant - Age",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728015394895,
        "type": "TextField",
        "x": 202,
        "y": 467.77781168619794,
        "width": 79,
        "height": 20,
        "value": "Respondent - Age",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728015425495,
        "type": "TextField",
        "x": 348,
        "y": 449.7777506510417,
        "width": 190,
        "height": 20,
        "value": "Applicant - Birthdate (d, m, y)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728015476750,
        "type": "TextField",
        "x": 348,
        "y": 467.3332926432292,
        "width": 190,
        "height": 20,
        "value": "Respondent - Birthdate (d, m, y)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 15,
        "type": "CheckBox",
        "x": 80.66666666666667,
        "y": 505.33335367838544,
        "width": 23,
        "height": 19,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 16,
        "type": "CheckBox",
        "x": 80.66666666666667,
        "y": 524,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 17,
        "type": "CheckBox",
        "x": 80.66666666666667,
        "y": 542,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 18,
        "type": "CheckBox",
        "x": 80,
        "y": 560,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 19,
        "type": "CheckBox",
        "x": 80.66666666666667,
        "y": 578,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1728016678204,
        "type": "TextField",
        "x": 180.66666666666666,
        "y": 502,
        "width": 150,
        "height": 20,
        "value": "Married on (date)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728016700572,
        "type": "TextField",
        "x": 192,
        "y": 521.3333333333334,
        "width": 150,
        "height": 20,
        "value": "Separated on (date)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728016723617,
        "type": "TextField",
        "x": 242.66666666666666,
        "y": 539.3333333333334,
        "width": 150,
        "height": 20,
        "value": "Started Living together on (date)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728016759553,
        "type": "TextField",
        "x": 172.66666666666666,
        "y": 575.1111246744791,
        "width": 614,
        "height": 21,
        "value": "Other (Explain)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728016798205,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 80,
        "y": 642,
        "width": 757,
        "height": 121,
        "data": [
          [
            "The Basic information about the child(ren) is as follows",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 25,
        "type": "CheckBox",
        "x": 86.66666666666667,
        "y": 103.33333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 26,
        "type": "CheckBox",
        "x": 86,
        "y": 122,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 27,
        "type": "CheckBox",
        "x": 86.66666666666667,
        "y": 140,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 28,
        "type": "CheckBox",
        "x": 85.33333333333333,
        "y": 158,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 29,
        "type": "CheckBox",
        "x": 260.6666666666667,
        "y": 105.33333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 30,
        "type": "CheckBox",
        "x": 261.3333333333333,
        "y": 122.66666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 31,
        "type": "CheckBox",
        "x": 261.3333333333333,
        "y": 138.66666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 32,
        "type": "CheckBox",
        "x": 396,
        "y": 104.66666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 33,
        "type": "CheckBox",
        "x": 396.6666666666667,
        "y": 122.66666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 34,
        "type": "CheckBox",
        "x": 396,
        "y": 140.66666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1728020573346,
        "type": "TextField",
        "x": 434,
        "y": 40.666666666666664,
        "width": 221,
        "height": 20,
        "value": "Court File Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728020596133,
        "type": "TextField",
        "x": 178,
        "y": 286.6666564941406,
        "width": 175,
        "height": 20,
        "value": "Applicant $ Income of parties (Question 7)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728020604793,
        "type": "TextField",
        "x": 174,
        "y": 153.33331807454428,
        "width": 618,
        "height": 20,
        "value": "Other (Specify) [Questions 5]",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728020633541,
        "type": "TextField",
        "x": 176,
        "y": 246.00000508626303,
        "width": 613,
        "height": 22,
        "value": "Other (Specify) [Questions 6]",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 39,
        "type": "CheckBox",
        "x": 396.6666666666667,
        "y": 196,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 40,
        "type": "CheckBox",
        "x": 396,
        "y": 231.33333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1728021154889,
        "type": "TextField",
        "x": 179.33333333333334,
        "y": 304.6666768391927,
        "width": 175,
        "height": 20,
        "value": "Respondent $ Income of parties (Question 7)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728021217808,
        "type": "TextField",
        "x": 394.6666666666667,
        "y": 286.6666768391927,
        "width": 62,
        "height": 20,
        "value": "Applicant income year (Question 7)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728021324568,
        "type": "TextField",
        "x": 394,
        "y": 304.00001017252606,
        "width": 62,
        "height": 21,
        "value": "Respondent income year (Question 7)New Dynamic Field",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 46,
        "type": "CheckBox",
        "x": 86.66666666666667,
        "y": 198,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 47,
        "type": "CheckBox",
        "x": 86.66666666666667,
        "y": 213.33333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 48,
        "type": "CheckBox",
        "x": 86.66666666666667,
        "y": 232,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 49,
        "type": "CheckBox",
        "x": 86.66666666666667,
        "y": 250,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 50,
        "type": "CheckBox",
        "x": 260.6666666666667,
        "y": 232,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 51,
        "type": "CheckBox",
        "x": 87.33333333333333,
        "y": 346.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 52,
        "type": "CheckBox",
        "x": 165.33333333333334,
        "y": 345.3333435058594,
        "width": 20,
        "height": 38,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 53,
        "type": "CheckBox",
        "x": 86.66666666666667,
        "y": 422.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 54,
        "type": "CheckBox",
        "x": 86,
        "y": 441.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 55,
        "type": "CheckBox",
        "x": 166,
        "y": 439.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 56,
        "type": "CheckBox",
        "x": 165.33333333333334,
        "y": 459.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 57,
        "type": "CheckBox",
        "x": 88,
        "y": 498.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 58,
        "type": "CheckBox",
        "x": 87.33333333333333,
        "y": 516.6666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1728022822294,
        "type": "TextField",
        "x": 259.3333333333333,
        "y": 438.6666768391927,
        "width": 244,
        "height": 20,
        "value": "an order dated (Questions 9)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728022871066,
        "type": "TextField",
        "x": 240.66666666666666,
        "y": 493.3332926432292,
        "width": 270,
        "height": 20,
        "value": "No. Should they attend one ?) [Question 10]",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728022937543,
        "type": "TextArea",
        "x": 85.33333333333333,
        "y": 610,
        "width": 679,
        "height": 212,
        "value": "[Quesstion 11] What are the issues for this case conference? What are the important facts for this case conference?",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728023116486,
        "type": "TextField",
        "x": 434.6666666666667,
        "y": 39.333333333333336,
        "width": 221,
        "height": 20,
        "value": "Court File Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728023137498,
        "type": "TextArea",
        "x": 87.33333333333333,
        "y": 81.33333333333333,
        "width": 711,
        "height": 174,
        "value": "Question 12 What is your proposal to resolve these issues?",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 62,
        "type": "CheckBox",
        "x": 86.66666666666667,
        "y": 219.33333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 63,
        "type": "CheckBox",
        "x": 168,
        "y": 220,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1728023221806,
        "type": "TextArea",
        "x": 86.66666666666667,
        "y": 236.00000699361166,
        "width": 710,
        "height": 65,
        "value": "Question 13 - Yes. (Give details)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728023283514,
        "type": "TextField",
        "x": 294.6666666666667,
        "y": 339.3333231608073,
        "width": 113,
        "height": 20,
        "value": "page/tab number of the financial statement in the continuing record is",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728023341274,
        "type": "TextArea",
        "x": 85.33333333333333,
        "y": 388,
        "width": 736,
        "height": 174,
        "value": "14. If a claim is being made for child support and a claim is made for special expenses under the child support guidelines, give details of those expenses or attach additional information. ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728023554413,
        "type": "TextArea",
        "x": 86.66666666666667,
        "y": 530,
        "width": 741,
        "height": 337,
        "value": "15. If a claim is made for child support and you claim that the Child Support Guidelines table amount should not be ordered, briefly outline the reason here or attach an additional page.",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728023781185,
        "type": "TextField",
        "x": 444.6666666666667,
        "y": 39.99998474121094,
        "width": 198,
        "height": 20,
        "value": "Court File Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 69,
        "type": "CheckBox",
        "x": 112.66666666666667,
        "y": 120.66666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 70,
        "type": "CheckBox",
        "x": 194,
        "y": 120,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 71,
        "type": "CheckBox",
        "x": 114,
        "y": 200,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 72,
        "type": "CheckBox",
        "x": 193.33333333333334,
        "y": 200,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 1728023874024,
        "type": "TextArea",
        "x": 112,
        "y": 135.33333333333334,
        "width": 628,
        "height": 46,
        "value": "Question 16 (a) - Yes (Give names of possible assessors.)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728023918497,
        "type": "TextArea",
        "x": 111.33333333333333,
        "y": 215.99998982747397,
        "width": 648,
        "height": 62,
        "value": "Question 16 (b) - Yes (Give emails and reasons)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 75,
        "type": "CheckBox",
        "x": 86.66666666666667,
        "y": 286.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 76,
        "type": "CheckBox",
        "x": 166.66666666666666,
        "y": 286,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 1728023996497,
        "type": "TextArea",
        "x": 85.33333333333333,
        "y": 302.00001017252606,
        "width": 681,
        "height": 61,
        "value": "Question 17 Yes (Give details)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 78,
        "type": "CheckBox",
        "x": 86,
        "y": 361.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 79,
        "type": "CheckBox",
        "x": 167.33333333333334,
        "y": 361.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 1728024094681,
        "type": "TextArea",
        "x": 86,
        "y": 376.00001017252606,
        "width": 683,
        "height": 63,
        "value": "Question 18 Yes (Give details)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 81,
        "type": "CheckBox",
        "x": 86,
        "y": 437.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 82,
        "type": "CheckBox",
        "x": 166.66666666666666,
        "y": 436.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 1728024320460,
        "type": "TextArea",
        "x": 84.66666666666667,
        "y": 450.2222086588542,
        "width": 686,
        "height": 61,
        "value": "Question 19 No (who needs to be added?)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 84,
        "type": "CheckBox",
        "x": 87.33333333333333,
        "y": 507.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 85,
        "type": "CheckBox",
        "x": 166.66666666666666,
        "y": 507.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 1728024453900,
        "type": "TextArea",
        "x": 86.66666666666667,
        "y": 541.3333536783854,
        "width": 687,
        "height": 64,
        "value": "Question 20 Yes (if yes, provide details such as: the type of expert evidence; whether the parties will retaining a joint expert; who the expert will be; who will be paying the expert; how long it will take to obtain a report, etc.)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 87,
        "type": "CheckBox",
        "x": 87.33333333333333,
        "y": 602,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 88,
        "type": "CheckBox",
        "x": 168,
        "y": 602,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 1728024630584,
        "type": "TextField",
        "x": 71.33333333333333,
        "y": 666,
        "width": 264,
        "height": 20,
        "value": "Date of party's signature",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728024650148,
        "type": "TextArea",
        "x": 86,
        "y": 618,
        "width": 688,
        "height": 55,
        "value": "Question 21 Yes (Give details)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728024674520,
        "type": "TextField",
        "x": 69.33333333333333,
        "y": 699.3333333333334,
        "width": 268,
        "height": 23,
        "value": "Date of Lawyer's signature",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      }
    ]
  }

  if (formType === 'Form17C') {
    staticFields = [
      {
        "id": 1728025433251,
        "type": "TextField",
        "x": 439.3333333333333,
        "y": 51.333333333333336,
        "width": 209,
        "height": 20,
        "value": "Court FIle Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728025450323,
        "type": "TextField",
        "x": 129.33333333333334,
        "y": 52.666666666666664,
        "width": 354,
        "height": 21,
        "value": "Name of court",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728025468711,
        "type": "TextField",
        "x": 67.33333333333333,
        "y": 81.33333333333333,
        "width": 520,
        "height": 20,
        "value": "Court office address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728025493199,
        "type": "TextArea",
        "x": 50.666666666666664,
        "y": 136.66666666666666,
        "width": 384,
        "height": 51,
        "value": "Name of party filing this brief",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728025512438,
        "type": "TextArea",
        "x": 320.6666666666667,
        "y": 136.66666666666666,
        "width": 389,
        "height": 49,
        "value": "Date of settlement conference",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728025537559,
        "type": "TextArea",
        "x": 51.333333333333336,
        "y": 222.00000508626303,
        "width": 389,
        "height": 60,
        "value": "Applicant(s) Full legal name & address for service - street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728025614574,
        "type": "TextArea",
        "x": 51.333333333333336,
        "y": 313.333340326945,
        "width": 389,
        "height": 63,
        "value": "Respondent(s) Full legal name & address for service - street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728025642194,
        "type": "TextArea",
        "x": 322.6666666666667,
        "y": 221.33334032694498,
        "width": 386,
        "height": 62,
        "value": "Applicant(s) Lawyer's name & address  - street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728025704634,
        "type": "TextArea",
        "x": 322,
        "y": 314.6666736602783,
        "width": 386,
        "height": 62,
        "value": "Respondent(s) Lawyer's name & address  - street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728025860954,
        "type": "TextArea",
        "x": 49.333333333333336,
        "y": 391.3333333333333,
        "width": 796,
        "height": 62,
        "value": "Name & address of Children's Lawyer's agent (street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any)) and name of person represented. ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728026008838,
        "type": "TextField",
        "x": 191.33333333333334,
        "y": 463.33335367838544,
        "width": 104,
        "height": 20,
        "value": "Applicant: Age",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728026037666,
        "type": "TextField",
        "x": 191.33333333333334,
        "y": 488.66668701171875,
        "width": 104,
        "height": 20,
        "value": "Respondent : Age",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728026067738,
        "type": "TextField",
        "x": 370.6666666666667,
        "y": 463.3333333333333,
        "width": 150,
        "height": 20,
        "value": "Applicant: Birthdate (d, m, y)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728026073074,
        "type": "TextField",
        "x": 372,
        "y": 488,
        "width": 150,
        "height": 20,
        "value": "Respondent : Birthdate (d, m, y)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728026197986,
        "type": "TextField",
        "x": 168,
        "y": 530,
        "width": 150,
        "height": 20,
        "value": "Married on (date)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728026220994,
        "type": "TextField",
        "x": 230.66666666666666,
        "y": 566.6666666666666,
        "width": 150,
        "height": 20,
        "value": "Started living together on (date)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728026222538,
        "type": "TextField",
        "x": 182.66666666666666,
        "y": 548.6666666666666,
        "width": 150,
        "height": 20,
        "value": "Separated on (date)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728026295881,
        "type": "TextArea",
        "x": 88.66666666666667,
        "y": 617.5555623372396,
        "width": 734,
        "height": 193,
        "value": "Other (Explain)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 19,
        "type": "CheckBox",
        "x": 68.66666666666667,
        "y": 532.6666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 20,
        "type": "CheckBox",
        "x": 69.33333333333333,
        "y": 550.6666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 21,
        "type": "CheckBox",
        "x": 68.66666666666667,
        "y": 568,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 22,
        "type": "CheckBox",
        "x": 68.66666666666667,
        "y": 587.3333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 23,
        "type": "CheckBox",
        "x": 68,
        "y": 603.3333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1728026521950,
        "type": "TextField",
        "x": 439.3333333333333,
        "y": 40,
        "width": 208,
        "height": 20,
        "value": "Court File Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728026541933,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 72.66666666666667,
        "y": 115.33334032694499,
        "width": 759,
        "height": 128,
        "data": [
          [
            "4 The basic information about the child(ren) is as follows:",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 26,
        "type": "CheckBox",
        "x": 72.66666666666667,
        "y": 372,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 27,
        "type": "CheckBox",
        "x": 255.33333333333334,
        "y": 372.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 28,
        "type": "CheckBox",
        "x": 404.6666666666667,
        "y": 371.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 29,
        "type": "CheckBox",
        "x": 404.6666666666667,
        "y": 388.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 30,
        "type": "CheckBox",
        "x": 255.33333333333334,
        "y": 389.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 31,
        "type": "CheckBox",
        "x": 72,
        "y": 390,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 32,
        "type": "CheckBox",
        "x": 404.6666666666667,
        "y": 406,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 33,
        "type": "CheckBox",
        "x": 254.66666666666666,
        "y": 406.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 34,
        "type": "CheckBox",
        "x": 72,
        "y": 406,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 35,
        "type": "CheckBox",
        "x": 72,
        "y": 424.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1728026875937,
        "type": "TextField",
        "x": 159.33333333333334,
        "y": 421.55556233723956,
        "width": 633,
        "height": 20,
        "value": "Question 5 other (Specify)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 37,
        "type": "CheckBox",
        "x": 404,
        "y": 466,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 38,
        "type": "CheckBox",
        "x": 404,
        "y": 484,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 39,
        "type": "CheckBox",
        "x": 404,
        "y": 501.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 40,
        "type": "CheckBox",
        "x": 255.33333333333334,
        "y": 465.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 41,
        "type": "CheckBox",
        "x": 254.66666666666666,
        "y": 482.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 42,
        "type": "CheckBox",
        "x": 254.66666666666666,
        "y": 500,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 43,
        "type": "CheckBox",
        "x": 72.66666666666667,
        "y": 466,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 44,
        "type": "CheckBox",
        "x": 71.33333333333333,
        "y": 482.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 45,
        "type": "CheckBox",
        "x": 72,
        "y": 499.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 46,
        "type": "CheckBox",
        "x": 72,
        "y": 520.6666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1728027121544,
        "type": "TextField",
        "x": 158.66666666666666,
        "y": 519.5555623372396,
        "width": 365,
        "height": 20,
        "value": "Question 6 other (Specify)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728027185044,
        "type": "TextField",
        "x": 146,
        "y": 562,
        "width": 135,
        "height": 20,
        "value": "Applicant $",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728027206980,
        "type": "TextField",
        "x": 146.66666666666666,
        "y": 579.5555826822916,
        "width": 136,
        "height": 20,
        "value": "Respondent $",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728027234772,
        "type": "TextField",
        "x": 332.6666666666667,
        "y": 562.0000203450521,
        "width": 101,
        "height": 20,
        "value": "Applicant Year",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728027264516,
        "type": "TextField",
        "x": 332.6666666666667,
        "y": 580.0000305175781,
        "width": 102,
        "height": 20,
        "value": "Respondent Year",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728027301920,
        "type": "TextArea",
        "x": 71.33333333333333,
        "y": 618.4444478352865,
        "width": 747,
        "height": 208,
        "value": "Question 8\n\nWhat are the issues for this settlement conference? What are the important facts for this settlement conference?",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 53,
        "type": "CheckBox",
        "x": 70.66666666666667,
        "y": 89.33333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 54,
        "type": "CheckBox",
        "x": 151.33333333333334,
        "y": 89.33333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1728027493292,
        "type": "TextArea",
        "x": 70,
        "y": 103.33331807454427,
        "width": 759,
        "height": 117,
        "value": "Question 9 \n\nYes (Give details)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 56,
        "type": "CheckBox",
        "x": 72,
        "y": 206.66666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 57,
        "type": "CheckBox",
        "x": 72,
        "y": 223.33333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 58,
        "type": "CheckBox",
        "x": 131.33333333333334,
        "y": 222,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 59,
        "type": "CheckBox",
        "x": 131.33333333333334,
        "y": 242,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1728027554616,
        "type": "TextField",
        "x": 218,
        "y": 221.33334032694498,
        "width": 538,
        "height": 20,
        "value": "Question 10 - an order dated",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 61,
        "type": "CheckBox",
        "x": 71.33333333333333,
        "y": 282,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 62,
        "type": "CheckBox",
        "x": 150,
        "y": 281.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1728027615059,
        "type": "TextArea",
        "x": 70,
        "y": 296.00001017252606,
        "width": 760,
        "height": 128,
        "value": "Question 11\n\nYes (Identify the issues and give details of why the issues are urgent.)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 64,
        "type": "CheckBox",
        "x": 72,
        "y": 428,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 65,
        "type": "CheckBox",
        "x": 72,
        "y": 464,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1728027696848,
        "type": "TextField",
        "x": 87.33333333333333,
        "y": 443.55556233723956,
        "width": 600,
        "height": 20,
        "value": "Question 12 Yes (If it is not already filed in the continuing record, file it now. Give the tab/page number(s) of the assessment:",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728027759256,
        "type": "TextArea",
        "x": 90.66666666666667,
        "y": 476.4444580078125,
        "width": 690,
        "height": 111,
        "value": "Question 12 No (Explain why the assessment is not ready.)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 68,
        "type": "CheckBox",
        "x": 71.33333333333333,
        "y": 571.3333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 69,
        "type": "CheckBox",
        "x": 149.33333333333334,
        "y": 571.3333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1728027841255,
        "type": "TextArea",
        "x": 68.66666666666667,
        "y": 598.6666666666666,
        "width": 766,
        "height": 231,
        "value": "Question 13 \n\nYes (if yes, provide details such as: the type of expert evidence; whether the parties will be retaining a joint expert; who the expert will be; who will be paying the expert; how long it will take to obtain a report, etc.)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 71,
        "type": "CheckBox",
        "x": 71.33333333333333,
        "y": 78.66666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 72,
        "type": "CheckBox",
        "x": 149.33333333333334,
        "y": 78.66666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 1728027956716,
        "type": "TextArea",
        "x": 70.66666666666667,
        "y": 108.66665140787761,
        "width": 756,
        "height": 119,
        "value": "Question 14 \n\nIf not, when will they be provided?",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 74,
        "type": "CheckBox",
        "x": 72,
        "y": 226,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 75,
        "type": "CheckBox",
        "x": 72,
        "y": 243.33333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 1728028016143,
        "type": "TextArea",
        "x": 71.33333333333333,
        "y": 257.3333231608073,
        "width": 750,
        "height": 136,
        "value": "Question 15\n\nNo (Explain below)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 77,
        "type": "CheckBox",
        "x": 70.66666666666667,
        "y": 372.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 78,
        "type": "CheckBox",
        "x": 150.66666666666666,
        "y": 372,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 1728028137315,
        "type": "TextArea",
        "x": 70.66666666666667,
        "y": 387.3333435058594,
        "width": 754,
        "height": 133,
        "value": "Question 16 \n\nNo (State what has not been done.)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 80,
        "type": "CheckBox",
        "x": 72,
        "y": 500,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 81,
        "type": "CheckBox",
        "x": 151.33333333333334,
        "y": 500.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 1728028206043,
        "type": "TextArea",
        "x": 72,
        "y": 515.5555623372396,
        "width": 752,
        "height": 129,
        "value": "Question 17\n\nYes (Explain)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728028249042,
        "type": "TextField",
        "x": 341.3333333333333,
        "y": 608,
        "width": 84,
        "height": 20,
        "value": "Question 18 trial days",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728028347478,
        "type": "TextField",
        "x": 66.66666666666667,
        "y": 626,
        "width": 93,
        "height": 20,
        "value": "Question 18 Trial days",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728028476694,
        "type": "TextField",
        "x": 439.3333333333333,
        "y": 39.99998474121094,
        "width": 208,
        "height": 20,
        "value": "Court File Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 86,
        "type": "CheckBox",
        "x": 72.66666666666667,
        "y": 142,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 5
      },
      {
        "id": 87,
        "type": "CheckBox",
        "x": 235.33333333333334,
        "y": 141.33333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 5
      },
      {
        "id": 1728028524375,
        "type": "TextField",
        "x": 72.66666666666667,
        "y": 622,
        "width": 276,
        "height": 20,
        "value": "Date of party's signature",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1728028546942,
        "type": "TextField",
        "x": 74.66666666666667,
        "y": 677.3333333333334,
        "width": 274,
        "height": 20,
        "value": "Date of lawyer's signature",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      }
    ]
  }

  if (formType === 'Form17E') {
    staticFields = [
      {
        "id": 1728028636187,
        "type": "TextField",
        "x": 420.6666666666667,
        "y": 52,
        "width": 150,
        "height": 20,
        "value": "Court File Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728028694867,
        "type": "TextField",
        "x": 128,
        "y": 51.333333333333336,
        "width": 309,
        "height": 20,
        "value": "Name of court",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728028710830,
        "type": "TextField",
        "x": 66.66666666666667,
        "y": 81.33333333333333,
        "width": 508,
        "height": 20,
        "value": "Court office address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728028738270,
        "type": "TextArea",
        "x": 50,
        "y": 134.66666666666666,
        "width": 387,
        "height": 52,
        "value": "Name of party filing this brief",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728028756610,
        "type": "TextArea",
        "x": 320.6666666666667,
        "y": 134.66666666666666,
        "width": 386,
        "height": 53,
        "value": "Date of trial management conference",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728028785578,
        "type": "TextArea",
        "x": 50,
        "y": 214.00000699361166,
        "width": 387,
        "height": 63,
        "value": "Applicant(s)\nFull legal name & address for service - street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728028871290,
        "type": "TextArea",
        "x": 50,
        "y": 300.6666736602783,
        "width": 387,
        "height": 63,
        "value": "Respondent(s)\nFull legal name & address for service - street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728028903282,
        "type": "TextArea",
        "x": 321.3333333333333,
        "y": 214.00000699361166,
        "width": 388,
        "height": 64,
        "value": "Applicant(s)\nLawyer's name & address - street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728028955174,
        "type": "TextArea",
        "x": 320.6666666666667,
        "y": 300.6666736602783,
        "width": 388,
        "height": 62,
        "value": "Respondent(s)\nLawyer's name & address - street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any).",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728028978077,
        "type": "TextArea",
        "x": 50,
        "y": 377.99998982747394,
        "width": 795,
        "height": 65,
        "value": "Name & address of Children's Lawyer's agent (street & number, municipality, postal code, telephone & fax numbers and e-mail address (if any)) and name of person represented.",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 11,
        "type": "CheckBox",
        "x": 51.333333333333336,
        "y": 450,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 12,
        "type": "CheckBox",
        "x": 116.66666666666667,
        "y": 450,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1728029082698,
        "type": "TextField",
        "x": 194,
        "y": 447.55556233723956,
        "width": 580,
        "height": 20,
        "value": "Yes (Who?)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 14,
        "type": "CheckBox",
        "x": 110.66666666666667,
        "y": 514,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 15,
        "type": "CheckBox",
        "x": 219.33333333333334,
        "y": 514.6666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 16,
        "type": "CheckBox",
        "x": 110.66666666666667,
        "y": 532.6666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 17,
        "type": "CheckBox",
        "x": 110.66666666666667,
        "y": 568.6666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 18,
        "type": "CheckBox",
        "x": 111.33333333333333,
        "y": 586,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 19,
        "type": "CheckBox",
        "x": 374,
        "y": 568,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1728029302674,
        "type": "TextField",
        "x": 320,
        "y": 529.5555623372396,
        "width": 389,
        "height": 20,
        "value": "placing the chid(ren) with (name of person)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728029332397,
        "type": "TextField",
        "x": 144.66666666666666,
        "y": 547.7777913411459,
        "width": 264,
        "height": 22,
        "value": "for ........ months under supervision",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728029357465,
        "type": "TextField",
        "x": 238,
        "y": 565.5555013020834,
        "width": 124,
        "height": 20,
        "value": "care for ..... months",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728029381841,
        "type": "TextField",
        "x": 206.66666666666666,
        "y": 583.5555826822916,
        "width": 562,
        "height": 20,
        "value": "other (Specify)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 24,
        "type": "CheckBox",
        "x": 110.66666666666667,
        "y": 616.6666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 25,
        "type": "CheckBox",
        "x": 315.3333333333333,
        "y": 616,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 26,
        "type": "CheckBox",
        "x": 131.33333333333334,
        "y": 634,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 27,
        "type": "CheckBox",
        "x": 316.6666666666667,
        "y": 633.3333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 28,
        "type": "CheckBox",
        "x": 316.6666666666667,
        "y": 651.3333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 29,
        "type": "CheckBox",
        "x": 316,
        "y": 668,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 30,
        "type": "CheckBox",
        "x": 130,
        "y": 650.6666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 32,
        "type": "CheckBox",
        "x": 130,
        "y": 668.6666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 33,
        "type": "CheckBox",
        "x": 316,
        "y": 685.3333333333334,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 33,
        "type": "CheckBox",
        "x": 316,
        "y": 685.3333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 34,
        "type": "CheckBox",
        "x": 130,
        "y": 685.3333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 35,
        "type": "CheckBox",
        "x": 111.33333333333333,
        "y": 704,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1728029813797,
        "type": "TextField",
        "x": 202,
        "y": 700.8888956705729,
        "width": 569,
        "height": 20,
        "value": "other (Specify)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728029838353,
        "type": "TextArea",
        "x": 71.33333333333333,
        "y": 93.99998474121094,
        "width": 760,
        "height": 55,
        "value": "Question 2 \nWhere is the child living at the time of this conference?",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 38,
        "type": "CheckBox",
        "x": 70.66666666666667,
        "y": 154.66666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 39,
        "type": "CheckBox",
        "x": 149.33333333333334,
        "y": 154.66666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1728029919797,
        "type": "TextArea",
        "x": 70,
        "y": 168.6666717529297,
        "width": 763,
        "height": 47,
        "value": "Question 3 \nYes (identify the issues and give details of why the issues are urgent.)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 41,
        "type": "CheckBox",
        "x": 100,
        "y": 219.33333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 42,
        "type": "CheckBox",
        "x": 236,
        "y": 220,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 43,
        "type": "CheckBox",
        "x": 100,
        "y": 238.66666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 44,
        "type": "CheckBox",
        "x": 316,
        "y": 322.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 45,
        "type": "CheckBox",
        "x": 100.66666666666667,
        "y": 323.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 46,
        "type": "CheckBox",
        "x": 100,
        "y": 291.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 47,
        "type": "CheckBox",
        "x": 381.3333333333333,
        "y": 274,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 48,
        "type": "CheckBox",
        "x": 99.33333333333333,
        "y": 273.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1728030059041,
        "type": "TextField",
        "x": 310,
        "y": 236.00000699361166,
        "width": 406,
        "height": 20,
        "value": "with (name of person)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728030074141,
        "type": "TextField",
        "x": 135.33333333333334,
        "y": 253.33334032694498,
        "width": 263,
        "height": 20,
        "value": "for ..... months under supervision.",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728030096184,
        "type": "TextField",
        "x": 229.33333333333334,
        "y": 271.333340326945,
        "width": 124,
        "height": 20,
        "value": "care for .... months",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728030116412,
        "type": "TextField",
        "x": 193.33333333333334,
        "y": 289.333340326945,
        "width": 581,
        "height": 20,
        "value": "other (Specify)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 53,
        "type": "CheckBox",
        "x": 315.3333333333333,
        "y": 374,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 54,
        "type": "CheckBox",
        "x": 119.33333333333333,
        "y": 374,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 55,
        "type": "CheckBox",
        "x": 316,
        "y": 356.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 56,
        "type": "CheckBox",
        "x": 120,
        "y": 356.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 57,
        "type": "CheckBox",
        "x": 316,
        "y": 339.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 58,
        "type": "CheckBox",
        "x": 120,
        "y": 338,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 62,
        "type": "CheckBox",
        "x": 100.66666666666667,
        "y": 409.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 63,
        "type": "CheckBox",
        "x": 120,
        "y": 391.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 64,
        "type": "CheckBox",
        "x": 316,
        "y": 392.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1728030460904,
        "type": "TextField",
        "x": 193.33333333333334,
        "y": 406.8888905843099,
        "width": 581,
        "height": 21,
        "value": "other (Specify)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728030487568,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 50,
        "y": 585.3333333333334,
        "width": 793,
        "height": 172,
        "data": [
          [
            "6. (a) These are the witnesses...",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 1728030540152,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 50,
        "y": 150.00000699361166,
        "width": 802,
        "height": 172,
        "data": [
          [
            "6 (b) These are the expert withnesses...",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 1728030604124,
        "type": "TextField",
        "x": 326.6666666666667,
        "y": 276.00000699361163,
        "width": 118,
        "height": 20,
        "value": "is ..... days",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728030619283,
        "type": "TextField",
        "x": 445.3333333333333,
        "y": 40.666666666666664,
        "width": 212,
        "height": 20,
        "value": "Court File Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728030649920,
        "type": "TextField",
        "x": 68,
        "y": 294.00000699361163,
        "width": 139,
        "height": 20,
        "value": "is ..... days",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 68,
        "type": "CheckBox",
        "x": 72,
        "y": 493.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 69,
        "type": "CheckBox",
        "x": 202,
        "y": 424.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 70,
        "type": "CheckBox",
        "x": 72,
        "y": 424.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 71,
        "type": "CheckBox",
        "x": 70.66666666666667,
        "y": 554.6666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 72,
        "type": "CheckBox",
        "x": 151.33333333333334,
        "y": 493.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 73,
        "type": "CheckBox",
        "x": 71.33333333333333,
        "y": 357.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 74,
        "type": "CheckBox",
        "x": 202.66666666666666,
        "y": 356.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 75,
        "type": "CheckBox",
        "x": 152,
        "y": 554,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 76,
        "type": "CheckBox",
        "x": 72,
        "y": 658,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 77,
        "type": "CheckBox",
        "x": 151.33333333333334,
        "y": 658,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1728030838819,
        "type": "TextArea",
        "x": 71.33333333333333,
        "y": 369.3333435058594,
        "width": 758,
        "height": 59,
        "value": "Question 8 \nNo (Explain why not.)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728030973196,
        "type": "TextArea",
        "x": 71.33333333333333,
        "y": 439.1111246744792,
        "width": 760,
        "height": 58,
        "value": "Question 9 \nNo. (Indicate what has not been done)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728031002152,
        "type": "TextArea",
        "x": 70.66666666666667,
        "y": 507.1111246744792,
        "width": 759,
        "height": 48,
        "value": "Question 10\nYes (GIve details about the reports such as who prepared them and the issues addressed",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728031047607,
        "type": "TextArea",
        "x": 70,
        "y": 580.2222290039062,
        "width": 761,
        "height": 60,
        "value": "Question 11 \nIf no, when will they be provided?",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728031079299,
        "type": "TextArea",
        "x": 70,
        "y": 673.3333333333334,
        "width": 758,
        "height": 106,
        "value": "Question 13 \n\nYes. (Explain)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 83,
        "type": "CheckBox",
        "x": 70.66666666666667,
        "y": 83.33333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 84,
        "type": "CheckBox",
        "x": 208.66666666666666,
        "y": 83.33333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 85,
        "type": "CheckBox",
        "x": 71.33333333333333,
        "y": 151.33333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 86,
        "type": "CheckBox",
        "x": 208,
        "y": 150.66666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 87,
        "type": "CheckBox",
        "x": 72.66666666666667,
        "y": 218.66666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 88,
        "type": "CheckBox",
        "x": 208,
        "y": 218.66666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 89,
        "type": "CheckBox",
        "x": 209.33333333333334,
        "y": 433.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 90,
        "type": "CheckBox",
        "x": 71.33333333333333,
        "y": 433.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 1728031493254,
        "type": "TextArea",
        "x": 70,
        "y": 97.33333333333333,
        "width": 765,
        "height": 55,
        "value": "Question 14 \nNo (Explain why not.)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728031518663,
        "type": "TextArea",
        "x": 71.33333333333333,
        "y": 166,
        "width": 765,
        "height": 56,
        "value": "Question 15 \nNo (Explain.)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728031537103,
        "type": "TextArea",
        "x": 72.66666666666667,
        "y": 234.00001017252603,
        "width": 764,
        "height": 274,
        "value": "Question 16\n\nYes (Explain)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728031569226,
        "type": "TextArea",
        "x": 73.33333333333333,
        "y": 448.66664123535156,
        "width": 760,
        "height": 462,
        "value": "Question 17 \n\nNo (Explain)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 95,
        "type": "CheckBox",
        "x": 70.66666666666667,
        "y": 84,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 5
      },
      {
        "id": 96,
        "type": "CheckBox",
        "x": 205.33333333333334,
        "y": 83.33333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 5
      },
      {
        "id": 1728031636110,
        "type": "TextArea",
        "x": 70,
        "y": 97.33334032694499,
        "width": 763,
        "height": 352,
        "value": "Question 18 \n\nNo (Explain)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1728031687382,
        "type": "TextField",
        "x": 438.6666666666667,
        "y": 40,
        "width": 210,
        "height": 20,
        "value": "Court File Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1728031729799,
        "type": "TextField",
        "x": 90.66666666666667,
        "y": 362.6666768391927,
        "width": 216,
        "height": 20,
        "value": "Date of party's signature",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1728031764094,
        "type": "TextField",
        "x": 89.33333333333333,
        "y": 411.3333435058594,
        "width": 221,
        "height": 20,
        "value": "Date of lawyer's signature",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      }
    ]
  }
  if (formType === 'Form13B') {
    staticFields = [
      {
        "id": 1728288562299,
        "type": "TextField",
        "x": 22,
        "y": 444,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[0].item",
        "source": "assets"
      },
      {
        "id": 1728288562300,
        "type": "TextField",
        "x": 390,
        "y": 444,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[0].market_value.client.today",
        "source": "assets"
      },
      {
        "id": 1728288562301,
        "type": "TextField",
        "x": 497,
        "y": 444,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[0].market_value.opposing_party.today",
        "source": "assets"
      },
      {
        "id": 1728288562302,
        "type": "TextField",
        "x": 22,
        "y": 463,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[1].item",
        "source": "assets"
      },
      {
        "id": 1728288562303,
        "type": "TextField",
        "x": 390,
        "y": 463,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[1].market_value.client.today",
        "source": "assets"
      },
      {
        "id": 1728288562304,
        "type": "TextField",
        "x": 497,
        "y": 463,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[1].market_value.opposing_party.today",
        "source": "assets"
      },
      {
        "id": 1728288562305,
        "type": "TextField",
        "x": 22,
        "y": 482,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[2].item",
        "source": "assets"
      },
      {
        "id": 1728288562306,
        "type": "TextField",
        "x": 390,
        "y": 482,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[2].market_value.client.today",
        "source": "assets"
      },
      {
        "id": 1728288562307,
        "type": "TextField",
        "x": 497,
        "y": 482,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[2].market_value.opposing_party.today",
        "source": "assets"
      },
      {
        "id": 1728288562308,
        "type": "TextField",
        "x": 22,
        "y": 500.3333333333333,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[3].item",
        "source": "assets"
      },
      {
        "id": 1728288562309,
        "type": "TextField",
        "x": 390,
        "y": 501,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[3].market_value.client.today",
        "source": "assets"
      },
      {
        "id": 1728288562310,
        "type": "TextField",
        "x": 497,
        "y": 501,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[3].market_value.opposing_party.today",
        "source": "assets"
      },
      {
        "id": 1728288562311,
        "type": "TextField",
        "x": 22,
        "y": 519,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[4].item",
        "source": "assets"
      },
      {
        "id": 1728288562312,
        "type": "TextField",
        "x": 390,
        "y": 519,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[4].market_value.client.today",
        "source": "assets"
      },
      {
        "id": 1728288562313,
        "type": "TextField",
        "x": 497,
        "y": 519,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[4].market_value.opposing_party.today",
        "source": "assets"
      },
      {
        "id": 1728288562314,
        "type": "TextField",
        "x": 22,
        "y": 537.6666666666666,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[5].item",
        "source": "assets"
      },
      {
        "id": 1728288562315,
        "type": "TextField",
        "x": 390,
        "y": 537.6666666666666,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[5].market_value.client.today",
        "source": "assets"
      },
      {
        "id": 1728288562316,
        "type": "TextField",
        "x": 497,
        "y": 537.6666666666666,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[5].market_value.opposing_party.today",
        "source": "assets"
      },
      {
        "id": 1728288562317,
        "type": "TextField",
        "x": 22,
        "y": 556.6666666666666,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[6].item",
        "source": "assets"
      },
      {
        "id": 1728288562318,
        "type": "TextField",
        "x": 390,
        "y": 556.6666666666666,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[6].market_value.client.today",
        "source": "assets"
      },
      {
        "id": 1728288562319,
        "type": "TextField",
        "x": 497,
        "y": 556.6666666666666,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[6].market_value.opposing_party.today",
        "source": "assets"
      },
      {
        "id": 1728288562320,
        "type": "TextField",
        "x": 22,
        "y": 575,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[7].item",
        "source": "assets"
      },
      {
        "id": 1728288562321,
        "type": "TextField",
        "x": 390,
        "y": 575,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[7].market_value.client.today",
        "source": "assets"
      },
      {
        "id": 1728288562322,
        "type": "TextField",
        "x": 497,
        "y": 575,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[7].market_value.opposing_party.today",
        "source": "assets"
      },
      {
        "id": 1728288562323,
        "type": "TextField",
        "x": 21.333333333333332,
        "y": 593,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[8].item",
        "source": "assets"
      },
      {
        "id": 1728288562324,
        "type": "TextField",
        "x": 390,
        "y": 593,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[8].market_value.client.today",
        "source": "assets"
      },
      {
        "id": 1728288562325,
        "type": "TextField",
        "x": 497,
        "y": 593,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[8].market_value.opposing_party.today",
        "source": "assets"
      },
      {
        "id": 1728288562326,
        "type": "TextField",
        "x": 22,
        "y": 612,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[9].item",
        "source": "assets"
      },
      {
        "id": 1728288562327,
        "type": "TextField",
        "x": 390,
        "y": 612,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[9].market_value.client.today",
        "source": "assets"
      },
      {
        "id": 1728288562328,
        "type": "TextField",
        "x": 497,
        "y": 612,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[9].market_value.opposing_party.today",
        "source": "assets"
      },
      {
        "id": 1728288562329,
        "type": "TextField",
        "x": 21.333333333333332,
        "y": 631,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[10].item",
        "source": "assets"
      },
      {
        "id": 1728288562330,
        "type": "TextField",
        "x": 390,
        "y": 631,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[10].market_value.client.today",
        "source": "assets"
      },
      {
        "id": 1728288562331,
        "type": "TextField",
        "x": 497,
        "y": 631,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[10].market_value.opposing_party.today",
        "source": "assets"
      },
      {
        "id": 1728288562332,
        "type": "TextField",
        "x": 22,
        "y": 650,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[11].item",
        "source": "assets"
      },
      {
        "id": 1728288562333,
        "type": "TextField",
        "x": 390.6666666666667,
        "y": 650,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[11].market_value.client.today",
        "source": "assets"
      },
      {
        "id": 1728288562334,
        "type": "TextField",
        "x": 497,
        "y": 650,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[11].market_value.opposing_party.today",
        "source": "assets"
      },
      {
        "id": 1728288742430,
        "type": "TextField",
        "x": 21.333333333333332,
        "y": 668.6666666666666,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[12].item",
        "source": "assets"
      },
      {
        "id": 1728288755354,
        "type": "TextField",
        "x": 498,
        "y": 668.6666666666666,
        "width": "135",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[12].market_value.client.today",
        "source": "assets"
      },
      {
        "id": 1728288755609,
        "type": "TextField",
        "x": 390.6666666666667,
        "y": 668.6666666666666,
        "width": "135",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "items[12].market_value.opposing_party.today",
        "source": "assets"
      },
      {
        "id": 1728289046095,
        "type": "TextField",
        "x": 34.666666666666664,
        "y": 70,
        "width": 583,
        "height": 20,
        "value": "Armstrong Courthouse",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtName"
      },
      {
        "id": 1728289063054,
        "type": "TextField",
        "x": 34.666666666666664,
        "y": 100,
        "width": 583,
        "height": 20,
        "value": "ARDC Building 111 Queen St, PO Box 2000, Armstrong, Ontario P0T 1A0",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtOfficeAddress"
      },
      {
        "id": 1728289073629,
        "type": "TextField",
        "x": 436,
        "y": 72,
        "width": 150,
        "height": 20,
        "value": "RW- 001 ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1728289096250,
        "type": "TextArea",
        "x": 20,
        "y": 171.33333333333334,
        "width": 413,
        "height": 36,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.fullLegalName, applicant.address, applicant.municipality"
      },
      {
        "id": 1728289104656,
        "type": "TextArea",
        "x": 20,
        "y": 198,
        "width": "413",
        "height": "36",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.phoneAndFax, applicant.email"
      },
      {
        "id": 1728289118013,
        "type": "TextArea",
        "x": 316.6666666666667,
        "y": 172,
        "width": "413",
        "height": "36",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicantsLawyer.fullLegalName, applicantsLawyer.address"
      },
      {
        "id": 1728289129230,
        "type": "TextArea",
        "x": 20.666666666666668,
        "y": 292.6666666666667,
        "width": "413",
        "height": "34",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondent.phoneAndFax, respondent.email"
      },
      {
        "id": 1728289129390,
        "type": "TextArea",
        "x": 20,
        "y": 266.6666666666667,
        "width": "413",
        "height": "34",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondent.fullLegalName, respondent.address, respondent.municipality"
      },
      {
        "id": 1728289129707,
        "type": "TextArea",
        "x": 316,
        "y": 198,
        "width": "413",
        "height": "36",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicantsLawyer.phoneAndFax, applicantsLawyer.email"
      },
      {
        "id": 1728289138174,
        "type": "TextArea",
        "x": 317.3333333333333,
        "y": 266.6666666666667,
        "width": "413",
        "height": "34",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondentsLawyer.fullLegalName, respondentsLawyer.address"
      },
      {
        "id": 1728289141671,
        "type": "TextArea",
        "x": 316.6666666666667,
        "y": 292,
        "width": "413",
        "height": "34",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondentsLawyer.phoneAndFax, respondentsLawyer.email"
      },
      {
        "id": 1728289237338,
        "type": "TextField",
        "x": 142,
        "y": 319.3333333333333,
        "width": 667,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.fullLegalName"
      },
      {
        "id": 1728289245557,
        "type": "TextField",
        "x": 252.66666666666666,
        "y": 344,
        "width": 246,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728289258690,
        "type": "TextField",
        "x": 434.6666666666667,
        "y": 30.666666666666668,
        "width": 150,
        "height": 20,
        "value": "RW- 001 ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1728289267869,
        "type": "TextField",
        "x": 434,
        "y": 30,
        "width": 150,
        "height": 20,
        "value": "RW- 001 ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1728292679415,
        "type": "TextField",
        "x": 22,
        "y": 108,
        "width": 524,
        "height": 20,
        "value": "Line of credits",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[0].category",
        "source": "debts"
      },
      {
        "id": 1728292679416,
        "type": "TextField",
        "x": 390,
        "y": 108,
        "width": 135,
        "height": 20,
        "value": "500",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[0].on_valuation_date",
        "source": "debts"
      },
      {
        "id": 1728292679417,
        "type": "TextField",
        "x": 497,
        "y": 108,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "",
        "source": "debts"
      },
      {
        "id": 1728292679418,
        "type": "TextField",
        "x": 22,
        "y": 127,
        "width": 524,
        "height": 20,
        "value": "Mortgages",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[1].category",
        "source": "debts"
      },
      {
        "id": 1728292679419,
        "type": "TextField",
        "x": 390,
        "y": 127,
        "width": 135,
        "height": 20,
        "value": "2400",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[1].on_valuation_date",
        "source": "debts"
      },
      {
        "id": 1728292679420,
        "type": "TextField",
        "x": 497,
        "y": 127,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "",
        "source": "debts"
      },
      {
        "id": 1728292679421,
        "type": "TextField",
        "x": 22,
        "y": 146,
        "width": 524,
        "height": 20,
        "value": "Mortgages",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[2].category",
        "source": "debts"
      },
      {
        "id": 1728292679422,
        "type": "TextField",
        "x": 390,
        "y": 146,
        "width": 135,
        "height": 20,
        "value": "2400",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[2].on_valuation_date",
        "source": "debts"
      },
      {
        "id": 1728292679423,
        "type": "TextField",
        "x": 497,
        "y": 146,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "",
        "source": "debts"
      },
      {
        "id": 1728292679424,
        "type": "TextField",
        "x": 22,
        "y": 165,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[3].category",
        "source": "debts"
      },
      {
        "id": 1728292679425,
        "type": "TextField",
        "x": 390,
        "y": 165,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[3].on_valuation_date",
        "source": "debts"
      },
      {
        "id": 1728292679426,
        "type": "TextField",
        "x": 497,
        "y": 165,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "",
        "source": "debts"
      },
      {
        "id": 1728292679427,
        "type": "TextField",
        "x": 22,
        "y": 183.33333333333334,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[4].category",
        "source": "debts"
      },
      {
        "id": 1728292679428,
        "type": "TextField",
        "x": 390,
        "y": 184,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[4].on_valuation_date",
        "source": "debts"
      },
      {
        "id": 1728292679429,
        "type": "TextField",
        "x": 497,
        "y": 184,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "",
        "source": "debts"
      },
      {
        "id": 1728292679430,
        "type": "TextField",
        "x": 22,
        "y": 202.33333333333334,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[5].category",
        "source": "debts"
      },
      {
        "id": 1728292679431,
        "type": "TextField",
        "x": 390,
        "y": 203,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[5].on_valuation_date",
        "source": "debts"
      },
      {
        "id": 1728292679432,
        "type": "TextField",
        "x": 497,
        "y": 203,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "",
        "source": "debts"
      },
      {
        "id": 1728292679433,
        "type": "TextField",
        "x": 22,
        "y": 221.33333333333334,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[6].category",
        "source": "debts"
      },
      {
        "id": 1728292679434,
        "type": "TextField",
        "x": 390,
        "y": 222,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[6].on_valuation_date",
        "source": "debts"
      },
      {
        "id": 1728292679435,
        "type": "TextField",
        "x": 497,
        "y": 222,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "",
        "source": "debts"
      },
      {
        "id": 1728292679436,
        "type": "TextField",
        "x": 22,
        "y": 240.33333333333334,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[7].category",
        "source": "debts"
      },
      {
        "id": 1728292679437,
        "type": "TextField",
        "x": 390,
        "y": 240.33333333333334,
        "width": 135,
        "heaight": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[7].on_valuation_date",
        "source": "debts"
      },
      {
        "id": 1728292679438,
        "type": "TextField",
        "x": 497,
        "y": 240.33333333333334,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "",
        "source": "debts"
      },
      {
        "id": 1728292679439,
        "type": "TextField",
        "x": 22,
        "y": 258.6666666666667,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[8].category",
        "source": "debts"
      },
      {
        "id": 1728292679440,
        "type": "TextField",
        "x": 390,
        "y": 258.6666666666667,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[8].on_valuation_date",
        "source": "debts"
      },
      {
        "id": 1728292679441,
        "type": "TextField",
        "x": 497,
        "y": 258.6666666666667,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "",
        "source": "debts"
      },
      {
        "id": 1728292679442,
        "type": "TextField",
        "x": 22,
        "y": 277,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[9].category",
        "source": "debts"
      },
      {
        "id": 1728292679443,
        "type": "TextField",
        "x": 390,
        "y": 277,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[9].on_valuation_date",
        "source": "debts"
      },
      {
        "id": 1728292679444,
        "type": "TextField",
        "x": 497,
        "y": 277,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "",
        "source": "debts"
      },
      {
        "id": 1728292679445,
        "type": "TextField",
        "x": 22.666666666666668,
        "y": 295.3333333333333,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[10].category",
        "source": "debts"
      },
      {
        "id": 1728292679446,
        "type": "TextField",
        "x": 390,
        "y": 295.3333333333333,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[10].on_valuation_date",
        "source": "debts"
      },
      {
        "id": 1728292679447,
        "type": "TextField",
        "x": 497,
        "y": 295.3333333333333,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "",
        "source": "debts"
      },
      {
        "id": 1728292679448,
        "type": "TextField",
        "x": 22,
        "y": 313.6666666666667,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[11].category",
        "source": "debts"
      },
      {
        "id": 1728292679449,
        "type": "TextField",
        "x": 390.6666666666667,
        "y": 313.6666666666667,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[11].on_valuation_date",
        "source": "debts"
      },
      {
        "id": 1728292679450,
        "type": "TextField",
        "x": 497,
        "y": 313.6666666666667,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "",
        "source": "debts"
      },
      {
        "id": 1728292679451,
        "type": "TextField",
        "x": 21.333333333333332,
        "y": 333,
        "width": 524,
        "height": 21,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[12].category",
        "source": "debts"
      },
      {
        "id": 1728292679452,
        "type": "TextField",
        "x": 390,
        "y": 333,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[12].on_valuation_date",
        "source": "debts"
      },
      {
        "id": 1728292679453,
        "type": "TextField",
        "x": 497,
        "y": 333,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "",
        "source": "debts"
      },
      {
        "id": 1728299669521,
        "type": "TextField",
        "x": 22,
        "y": 466,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[0].category",
        "source": "properties"
      },
      {
        "id": 1728299669522,
        "type": "TextField",
        "x": 390,
        "y": 466,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[0].market_value.client.today",
        "source": "properties"
      },
      {
        "id": 1728299669523,
        "type": "TextField",
        "x": 497,
        "y": 466,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[0].market_value.opposing_party.today",
        "source": "properties"
      },
      {
        "id": 1728299669524,
        "type": "TextField",
        "x": 22,
        "y": 485,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[1].category",
        "source": "properties"
      },
      {
        "id": 1728299669525,
        "type": "TextField",
        "x": 390,
        "y": 485,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[1].market_value.client.today",
        "source": "properties"
      },
      {
        "id": 1728299669526,
        "type": "TextField",
        "x": 497,
        "y": 485,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[1].market_value.opposing_party.today",
        "source": "properties"
      },
      {
        "id": 1728299669527,
        "type": "TextField",
        "x": 22,
        "y": 504,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[2].category",
        "source": "properties"
      },
      {
        "id": 1728299669528,
        "type": "TextField",
        "x": 390,
        "y": 504,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[2].market_value.client.today",
        "source": "properties"
      },
      {
        "id": 1728299669529,
        "type": "TextField",
        "x": 497,
        "y": 504,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[2].market_value.opposing_party.today",
        "source": "properties"
      },
      {
        "id": 1728299669530,
        "type": "TextField",
        "x": 22,
        "y": 523,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[3].category",
        "source": "properties"
      },
      {
        "id": 1728299669531,
        "type": "TextField",
        "x": 390,
        "y": 523,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[3].market_value.client.today",
        "source": "properties"
      },
      {
        "id": 1728299669532,
        "type": "TextField",
        "x": 497,
        "y": 523,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[3].market_value.opposing_party.today",
        "source": "properties"
      },
      {
        "id": 1728299669533,
        "type": "TextField",
        "x": 22,
        "y": 542,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[4].category",
        "source": "properties"
      },
      {
        "id": 1728299669534,
        "type": "TextField",
        "x": 390,
        "y": 542,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[4].market_value.client.today",
        "source": "properties"
      },
      {
        "id": 1728299669535,
        "type": "TextField",
        "x": 497,
        "y": 542,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[4].market_value.opposing_party.today",
        "source": "properties"
      },
      {
        "id": 1728299669536,
        "type": "TextField",
        "x": 22,
        "y": 561,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[5].category",
        "source": "properties"
      },
      {
        "id": 1728299669537,
        "type": "TextField",
        "x": 390,
        "y": 561,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[5].market_value.client.today",
        "source": "properties"
      },
      {
        "id": 1728299669538,
        "type": "TextField",
        "x": 497,
        "y": 561,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[5].market_value.opposing_party.today",
        "source": "properties"
      },
      {
        "id": 1728301498825,
        "type": "TextField",
        "x": 22,
        "y": 616,
        "width": 524,
        "height": 20,
        "value": "Line of credits",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[0].category",
        "source": "debtsMarriage"
      },
      {
        "id": 1728301498826,
        "type": "TextField",
        "x": 390,
        "y": 616,
        "width": 135,
        "height": 20,
        "value": "500",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[0].on_valuation_date",
        "source": "debtsMarriage"
      },
      {
        "id": 1728301498827,
        "type": "TextField",
        "x": 497,
        "y": 616,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "",
        "source": "debtsMarriage"
      },
      {
        "id": 1728301498828,
        "type": "TextField",
        "x": 22,
        "y": 635,
        "width": 524,
        "height": 20,
        "value": "Mortgages",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[1].category",
        "source": "debtsMarriage"
      },
      {
        "id": 1728301498829,
        "type": "TextField",
        "x": 390,
        "y": 635,
        "width": 135,
        "height": 20,
        "value": "2400",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[1].on_valuation_date",
        "source": "debtsMarriage"
      },
      {
        "id": 1728301498830,
        "type": "TextField",
        "x": 497,
        "y": 635,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "",
        "source": "debtsMarriage"
      },
      {
        "id": 1728301498831,
        "type": "TextField",
        "x": 22,
        "y": 654,
        "width": 524,
        "height": 20,
        "value": "Mortgages",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[2].category",
        "source": "debtsMarriage"
      },
      {
        "id": 1728301498832,
        "type": "TextField",
        "x": 390,
        "y": 654,
        "width": 135,
        "height": 20,
        "value": "2400",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[2].on_valuation_date",
        "source": "debtsMarriage"
      },
      {
        "id": 1728301498833,
        "type": "TextField",
        "x": 497,
        "y": 654,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "",
        "source": "debtsMarriage"
      },
      {
        "id": 1728301498834,
        "type": "TextField",
        "x": 22,
        "y": 673,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[3].category",
        "source": "debtsMarriage"
      },
      {
        "id": 1728301498835,
        "type": "TextField",
        "x": 390,
        "y": 673,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[3].on_valuation_date",
        "source": "debtsMarriage"
      },
      {
        "id": 1728301498836,
        "type": "TextField",
        "x": 497,
        "y": 673,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "",
        "source": "debtsMarriage"
      },
      {
        "id": 1728301498837,
        "type": "TextField",
        "x": 22,
        "y": 692,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[4].category",
        "source": "debtsMarriage"
      },
      {
        "id": 1728301498838,
        "type": "TextField",
        "x": 390,
        "y": 692,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[4].on_valuation_date",
        "source": "debtsMarriage"
      },
      {
        "id": 1728301498839,
        "type": "TextField",
        "x": 497,
        "y": 692,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "",
        "source": "debtsMarriage"
      },
      {
        "id": 1728301498840,
        "type": "TextField",
        "x": 22,
        "y": 711,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[5].category",
        "source": "debtsMarriage"
      },
      {
        "id": 1728301498841,
        "type": "TextField",
        "x": 390,
        "y": 711,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "items[5].on_valuation_date",
        "source": "debtsMarriage"
      },
      {
        "id": 1728301498842,
        "type": "TextField",
        "x": 497,
        "y": 711,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "",
        "source": "debtsMarriage"
      },
      {
        "id": 1728306920155,
        "type": "TextField",
        "x": 22,
        "y": 108,
        "width": 524,
        "height": 20,
        "value": "Lands",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[0].category",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920156,
        "type": "TextField",
        "x": 390,
        "y": 108,
        "width": 135,
        "height": 20,
        "value": "2400",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[0].market_value.client.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920157,
        "type": "TextField",
        "x": 497,
        "y": 108,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[0].market_value.opposing_party.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920158,
        "type": "TextField",
        "x": 22,
        "y": 127,
        "width": 524,
        "height": 20,
        "value": "Lands",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[1].category",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920159,
        "type": "TextField",
        "x": 390,
        "y": 127,
        "width": 135,
        "height": 20,
        "value": "2400",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[1].market_value.client.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920160,
        "type": "TextField",
        "x": 497,
        "y": 127,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[1].market_value.opposing_party.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920161,
        "type": "TextField",
        "x": 22,
        "y": 146,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[2].category",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920162,
        "type": "TextField",
        "x": 390,
        "y": 146,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[2].market_value.client.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920163,
        "type": "TextField",
        "x": 497,
        "y": 146,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[2].market_value.opposing_party.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920164,
        "type": "TextField",
        "x": 22,
        "y": 165,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[3].category",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920165,
        "type": "TextField",
        "x": 390,
        "y": 165,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[3].market_value.client.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920166,
        "type": "TextField",
        "x": 497,
        "y": 165,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[3].market_value.opposing_party.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920167,
        "type": "TextField",
        "x": 22,
        "y": 184,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[4].category",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920168,
        "type": "TextField",
        "x": 390,
        "y": 184,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[4].market_value.client.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920169,
        "type": "TextField",
        "x": 497,
        "y": 184,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[4].market_value.opposing_party.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920170,
        "type": "TextField",
        "x": 22,
        "y": 203,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[5].category",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920171,
        "type": "TextField",
        "x": 390,
        "y": 203,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[5].market_value.client.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920172,
        "type": "TextField",
        "x": 497,
        "y": 203,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[5].market_value.opposing_party.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920173,
        "type": "TextField",
        "x": 22,
        "y": 222,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[6].category",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920174,
        "type": "TextField",
        "x": 390,
        "y": 222,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[6].market_value.client.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920175,
        "type": "TextField",
        "x": 497,
        "y": 222,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[6].market_value.opposing_party.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920176,
        "type": "TextField",
        "x": 22,
        "y": 241,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[7].category",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920177,
        "type": "TextField",
        "x": 390,
        "y": 241,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[7].market_value.client.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920178,
        "type": "TextField",
        "x": 497,
        "y": 241,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[7].market_value.opposing_party.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920179,
        "type": "TextField",
        "x": 22,
        "y": 260,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[8].category",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920180,
        "type": "TextField",
        "x": 390,
        "y": 260,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[8].market_value.client.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920181,
        "type": "TextField",
        "x": 497,
        "y": 260,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[8].market_value.opposing_party.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920182,
        "type": "TextField",
        "x": 22,
        "y": 279,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[9].category",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920183,
        "type": "TextField",
        "x": 390,
        "y": 279,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[9].market_value.client.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920184,
        "type": "TextField",
        "x": 497,
        "y": 279,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[9].market_value.opposing_party.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920185,
        "type": "TextField",
        "x": 22,
        "y": 298,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[10].category",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920186,
        "type": "TextField",
        "x": 390,
        "y": 298,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[10].market_value.client.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920187,
        "type": "TextField",
        "x": 497,
        "y": 298,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[10].market_value.opposing_party.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920188,
        "type": "TextField",
        "x": 22,
        "y": 317,
        "width": 524,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[11].category",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920189,
        "type": "TextField",
        "x": 390,
        "y": 317,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[11].market_value.client.today",
        "source": "property_exlcuded"
      },
      {
        "id": 1728306920190,
        "type": "TextField",
        "x": 497,
        "y": 317,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "items[11].market_value.opposing_party.today",
        "source": "property_exlcuded"
      },
      {
        "id": "1728309128384client",
        "type": "TextField",
        "x": 390,
        "y": 334,
        "width": 135,
        "height": 20,
        "value": "1290000",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": "1728309128384opposing",
        "type": "TextField",
        "x": 497,
        "y": 334,
        "width": 135,
        "height": 20,
        "value": "1290000",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      }
    ]
  }

  if (formType === 'Form13') {
    staticFields = [
      {
        "id": 1728050596357,
        "type": "TextField",
        "x": 58,
        "y": 55.99998474121094,
        "width": 555,
        "height": 20,
        "value": "Armstrong Courthouse",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtName"
      },
      {
        "id": 1728050625146,
        "type": "TextField",
        "x": 443.3333333333333,
        "y": 55.99998474121094,
        "width": 212,
        "height": 21,
        "value": "RW- 001 ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1728050658621,
        "type": "TextField",
        "x": 57.333333333333336,
        "y": 85.33332824707031,
        "width": 555,
        "height": 20,
        "value": "ARDC Building 111 Queen St, PO Box 2000, Armstrong, Ontario P0T 1A0",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtOfficeAddress"
      },
      {
        "id": 1728050686357,
        "type": "TextField",
        "x": 106,
        "y": 143.33331807454428,
        "width": 302,
        "height": 20,
        "value": "Ronald Weasley ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.fullLegalName"
      },
      {
        "id": 1728050726122,
        "type": "TextField",
        "x": 76.66666666666667,
        "y": 157.33331807454428,
        "width": 346,
        "height": 20,
        "value": "Suite 448 2179 Kasie Curve, South Frediamouth, AK 33028",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.address"
      },
      {
        "id": 1728050791559,
        "type": "TextField",
        "x": 92,
        "y": 171.99998474121094,
        "width": 323,
        "height": 20,
        "value": "(647)726-0053",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.phoneAndFax"
      },
      {
        "id": 1728050844479,
        "type": "TextField",
        "x": 66,
        "y": 186.6666717529297,
        "width": 362,
        "height": 20,
        "value": "Ron@gmail.com",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.email"
      },
      {
        "id": 1728050895420,
        "type": "TextField",
        "x": 390.6666666666667,
        "y": 143.33331807454428,
        "width": 292,
        "height": 20,
        "value": "Albus Dumbledore",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicantsLawyer.fullLegalName"
      },
      {
        "id": 1728050975712,
        "type": "TextField",
        "x": 361.3333333333333,
        "y": 157.99998474121094,
        "width": 336,
        "height": 20,
        "value": "Diagon Alley ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicantsLawyer.address"
      },
      {
        "id": 1728051004901,
        "type": "TextField",
        "x": 377.3333333333333,
        "y": 171.99998474121094,
        "width": 313,
        "height": 20,
        "value": "(647)726-0053",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicantsLawyer.phoneAndFax"
      },
      {
        "id": 1728051053398,
        "type": "TextField",
        "x": 350.6666666666667,
        "y": 187.33331807454428,
        "width": 352,
        "height": 19,
        "value": "albus@lawyer.com",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicantsLawyer.email"
      },
      {
        "id": 1728051090847,
        "type": "TextField",
        "x": 106,
        "y": 217.33331807454428,
        "width": 302,
        "height": 20,
        "value": "Hermione Weasley",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondent.fullLegalName"
      },
      {
        "id": 1728051111436,
        "type": "TextField",
        "x": 76.66666666666667,
        "y": 232.00000508626303,
        "width": 347,
        "height": 20,
        "value": "209 Edgardo Valley, Port Pedroberg, MS 98950-1079",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondent.address"
      },
      {
        "id": 1728051140782,
        "type": "TextField",
        "x": 93.33333333333333,
        "y": 246.6666717529297,
        "width": 322,
        "height": 20,
        "value": "(647)726-0053",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondent.phoneAndFax"
      },
      {
        "id": 1728051154452,
        "type": "TextField",
        "x": 66,
        "y": 261.3333384195964,
        "width": 362,
        "height": 20,
        "value": "Hermione Weasley",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondent.email"
      },
      {
        "id": 1728051174086,
        "type": "TextField",
        "x": 390.6666666666667,
        "y": 216.6666514078776,
        "width": 292,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondentsLawyer.fullLegalName"
      },
      {
        "id": 1728051214572,
        "type": "TextField",
        "x": 362,
        "y": 231.33333841959634,
        "width": 334,
        "height": 21,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondentsLawyer.address"
      },
      {
        "id": 1728051245156,
        "type": "TextField",
        "x": 378,
        "y": 246.6666717529297,
        "width": 311,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondentsLawyer.phoneAndFax"
      },
      {
        "id": 1728051269345,
        "type": "TextField",
        "x": 352.6666666666667,
        "y": 260.6666717529297,
        "width": 350,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "respondentsLawyer.email"
      },
      {
        "id": 20,
        "type": "CheckBox",
        "x": 45.333333333333336,
        "y": 294,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 21,
        "type": "CheckBox",
        "x": 128.66666666666666,
        "y": 294.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1728051687947,
        "type": "TextField",
        "x": 202.66666666666666,
        "y": 529.9999796549479,
        "width": 574,
        "height": 17,
        "value": "Ronald Weasley ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.fullLegalName"
      },
      {
        "id": 1728051751942,
        "type": "TextField",
        "x": 216,
        "y": 548.8000081380209,
        "width": 557,
        "height": 16,
        "value": "Adelaide-Metcalfe, Township of, Ontario",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "applicant.municipality, applicant.province"
      },
      {
        "id": 24,
        "type": "CheckBox",
        "x": 75.33333333333333,
        "y": 602,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 25,
        "type": "CheckBox",
        "x": 75.33333333333333,
        "y": 633.3333333333334,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 26,
        "type": "CheckBox",
        "x": 75.33333333333333,
        "y": 662.6666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1728052073238,
        "type": "TextField",
        "x": 444.6666666666667,
        "y": 46,
        "width": 209,
        "height": 20,
        "value": "RW- 001 ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 28,
        "type": "CheckBox",
        "x": 75.33333333333333,
        "y": 81.33333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 29,
        "type": "CheckBox",
        "x": 191.33333333333334,
        "y": 80.66666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 30,
        "type": "CheckBox",
        "x": 334,
        "y": 80.66666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 31,
        "type": "CheckBox",
        "x": 434.6666666666667,
        "y": 81.33333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 32,
        "type": "CheckBox",
        "x": 75.33333333333333,
        "y": 97.33333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 33,
        "type": "CheckBox",
        "x": 75.33333333333333,
        "y": 114.66666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 34,
        "type": "CheckBox",
        "x": 75.33333333333333,
        "y": 130,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 35,
        "type": "CheckBox",
        "x": 76,
        "y": 176,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1728052459982,
        "type": "Number",
        "x": 303.3333333333333,
        "y": 146.66666666666666,
        "width": 150,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 37,
        "type": "CheckBox",
        "x": 76,
        "y": 333.3333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1728052592825,
        "type": "Number",
        "x": 470,
        "y": 426.9333801269531,
        "width": 168,
        "height": 20,
        "value": 350,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "income.client.employmentIncome"
      },
      {
        "id": 1728052807887,
        "type": "Number",
        "x": 469.3333333333333,
        "y": 448.13335673014325,
        "width": 168,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "income.client.commissionTipsBonuses"
      },
      {
        "id": 1728052877683,
        "type": "Number",
        "x": 470,
        "y": 469.99997965494794,
        "width": 168,
        "height": 20,
        "value": 50,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "income.client.selfEmploymentIncome"
      },
      {
        "id": 1728052944726,
        "type": "Number",
        "x": 470,
        "y": 490.6666564941406,
        "width": 172,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "income.client.employmentInsuranceBenefits"
      },
      {
        "id": 1728052973637,
        "type": "Number",
        "x": 470,
        "y": 513.4667256673177,
        "width": 171,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "income.client.workersCompensationBenefits"
      },
      {
        "id": 1728052989686,
        "type": "Number",
        "x": 470.6666666666667,
        "y": 536.1333618164062,
        "width": 171,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "income.client.socialAssistanceIncome"
      },
      {
        "id": 1728053002454,
        "type": "Number",
        "x": 470,
        "y": 556.6666870117188,
        "width": 171,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "income.client.interestInvestmentIncome"
      },
      {
        "id": 1728053014015,
        "type": "Number",
        "x": 470,
        "y": 579.4666951497396,
        "width": 171,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "income.client.pensionIncome"
      },
      {
        "id": 1728053040757,
        "type": "Number",
        "x": 470,
        "y": 601.4666951497396,
        "width": 171,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "income.client.spousalSupport"
      },
      {
        "id": 1728053050093,
        "type": "Number",
        "x": 470.6666666666667,
        "y": 622.8000284830729,
        "width": 170,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "income.client.childTaxBenefits"
      },
      {
        "id": 1728053066497,
        "type": "Number",
        "x": 471.3333333333333,
        "y": 644.8000284830729,
        "width": 169,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "bind": "income.client.otherIncome"
      },
      {
        "id": 1728053118802,
        "type": "Number",
        "x": 471.3333333333333,
        "y": 666.6666870117188,
        "width": 169,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728053146305,
        "type": "Number",
        "x": 471.3333333333333,
        "y": 683.4666951497396,
        "width": 168,
        "height": 19,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728053726476,
        "type": "TextField",
        "x": 445.3333333333333,
        "y": 46.66666158040365,
        "width": 208,
        "height": 20,
        "value": "RW- 001 ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1728053787088,
        "type": "TextField",
        "x": 38.666666666666664,
        "y": 141,
        "width": 150,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728053826911,
        "type": "TextField",
        "x": 146.66666666666666,
        "y": 141,
        "width": 474,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728053869630,
        "type": "Number",
        "x": 479,
        "y": 141,
        "width": 157,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728054038314,
        "type": "TextField",
        "x": 38.666666666666664,
        "y": 163,
        "width": 150,
        "height": "20",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728054080351,
        "type": "TextField",
        "x": 146.66666666666666,
        "y": 163,
        "width": 474,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728054117170,
        "type": "Number",
        "x": 479,
        "y": 163.00000508626303,
        "width": 156,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728054202755,
        "type": "TextField",
        "x": 38.666666666666664,
        "y": 187,
        "width": 150,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728054232421,
        "type": "TextField",
        "x": 146.66666666666666,
        "y": 187.00000508626303,
        "width": 475,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728054263710,
        "type": "Number",
        "x": 479.3333333333333,
        "y": 187,
        "width": 156,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728054297476,
        "type": "TextField",
        "x": 38.666666666666664,
        "y": 212,
        "width": 150,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728054308987,
        "type": "TextField",
        "x": 148,
        "y": 212,
        "width": 474,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728054420196,
        "type": "Number",
        "x": 480,
        "y": 212.00000508626303,
        "width": 155,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728054606397,
        "type": "Number",
        "x": 224.66666666666666,
        "y": 298.00000762939453,
        "width": 115,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728054622052,
        "type": "Number",
        "x": 224.66666666666666,
        "y": 321.33334096272785,
        "width": 115,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728054647115,
        "type": "Number",
        "x": 224.66666666666666,
        "y": 345.33334096272785,
        "width": 115,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728054701518,
        "type": "Number",
        "x": 224,
        "y": 370.00000762939453,
        "width": 116,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728054710349,
        "type": "Number",
        "x": 225.33333333333334,
        "y": 393.33334096272785,
        "width": 115,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728054723760,
        "type": "Number",
        "x": 224.66666666666666,
        "y": 416.6666742960612,
        "width": 117,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728054766590,
        "type": "Number",
        "x": 506,
        "y": 297.33334096272785,
        "width": 116,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728054786630,
        "type": "Number",
        "x": 506.6666666666667,
        "y": 321.33334096272785,
        "width": 115,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728054809908,
        "type": "Number",
        "x": 506.6666666666667,
        "y": 345.33334096272785,
        "width": 114,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728054824294,
        "type": "Number",
        "x": 506.6666666666667,
        "y": 368.6666742960612,
        "width": 115,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728054851328,
        "type": "Number",
        "x": 506.6666666666667,
        "y": 393.33334096272785,
        "width": 115,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728054866007,
        "type": "Number",
        "x": 506,
        "y": 416.00000762939453,
        "width": 116,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728055518105,
        "type": "Number",
        "x": 506.6666666666667,
        "y": 440.8000081380208,
        "width": 115,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728055651635,
        "type": "Number",
        "x": 224.66666666666666,
        "y": 465.4667256673177,
        "width": 117,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728055686322,
        "type": "Number",
        "x": 224.66666666666666,
        "y": 489.7333577473958,
        "width": 117,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728055715809,
        "type": "Number",
        "x": 224.00000508626303,
        "y": 512.933359781901,
        "width": 118,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728055741652,
        "type": "Number",
        "x": 224.00000508626303,
        "y": 537.2000528971354,
        "width": 118,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728055768744,
        "type": "Number",
        "x": 223.3332977294922,
        "y": 560.6666870117188,
        "width": 119,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728056022312,
        "type": "Number",
        "x": 223.33333841959634,
        "y": 584.5333658854166,
        "width": 119,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728056044557,
        "type": "Number",
        "x": 505.33335876464844,
        "y": 489.33336385091144,
        "width": 119,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728056069915,
        "type": "Number",
        "x": 506.0000254313151,
        "y": 512.6666870117188,
        "width": 118,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728056092029,
        "type": "Number",
        "x": 506.0000254313151,
        "y": 536.6666870117188,
        "width": 118,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728056109328,
        "type": "Number",
        "x": 505.33335876464844,
        "y": 561.3333536783854,
        "width": 120,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728056128613,
        "type": "Number",
        "x": 506.0000254313151,
        "y": 584.6666870117188,
        "width": 118,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728056158628,
        "type": "Number",
        "x": 224.00000508626303,
        "y": 630.9333699544271,
        "width": 118,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728056599960,
        "type": "Number",
        "x": 223.33333841959634,
        "y": 654.8000284830729,
        "width": 119,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728056664378,
        "type": "Number",
        "x": 224.00000508626303,
        "y": 673.86669921875,
        "width": 117,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728057023120,
        "type": "Number",
        "x": 506.0000254313151,
        "y": 631.3333536783854,
        "width": 117,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728057057561,
        "type": "Number",
        "x": 506.0000254313151,
        "y": 655.2000325520834,
        "width": 118,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728057094983,
        "type": "Number",
        "x": 505.33335876464844,
        "y": 673.86669921875,
        "width": 120,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728057230288,
        "type": "Number",
        "x": 223.33333841959634,
        "y": 102.66666666666667,
        "width": 119,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057238165,
        "type": "Number",
        "x": 505.33335876464844,
        "y": 102.66666666666667,
        "width": 119,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057247480,
        "type": "Number",
        "x": 224.00000508626303,
        "y": 128,
        "width": 118,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057254064,
        "type": "Number",
        "x": 506.0000254313151,
        "y": 128.66666666666666,
        "width": 118,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057297544,
        "type": "Number",
        "x": 223.3332977294922,
        "y": 154.66666666666666,
        "width": 119,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057303977,
        "type": "Number",
        "x": 505.33335876464844,
        "y": 154,
        "width": 119,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057311565,
        "type": "Number",
        "x": 223.99996439615884,
        "y": 178.66666666666666,
        "width": 119,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057317825,
        "type": "Number",
        "x": 506.0000254313151,
        "y": 178,
        "width": 118,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057330045,
        "type": "Number",
        "x": 223.3332977294922,
        "y": 204,
        "width": 118,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057337215,
        "type": "Number",
        "x": 505.33335876464844,
        "y": 228,
        "width": 120,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057349231,
        "type": "Number",
        "x": 224.00000508626303,
        "y": 251.86666361490884,
        "width": 120,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057358856,
        "type": "Number",
        "x": 224.66663106282553,
        "y": 276.000005086263,
        "width": 118,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057367203,
        "type": "Number",
        "x": 505.33335876464844,
        "y": 251.99998982747397,
        "width": 120,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057377134,
        "type": "Number",
        "x": 224.66663106282553,
        "y": 299.3333384195964,
        "width": 118,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057387804,
        "type": "Number",
        "x": 505.33335876464844,
        "y": 275.3333333333333,
        "width": 120,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057400134,
        "type": "Number",
        "x": 223.99996439615884,
        "y": 322.6666717529297,
        "width": 118,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057406753,
        "type": "Number",
        "x": 506.0000254313151,
        "y": 299.3333435058594,
        "width": 119,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057421691,
        "type": "Number",
        "x": 505.33335876464844,
        "y": 323.3333028157552,
        "width": 120,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057432879,
        "type": "Number",
        "x": 223.99996439615884,
        "y": 345.3333384195964,
        "width": 118,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057447622,
        "type": "Number",
        "x": 506.66669209798175,
        "y": 345.3333435058594,
        "width": 118,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057458452,
        "type": "Number",
        "x": 225.3332977294922,
        "y": 369.3333384195964,
        "width": 116,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057471090,
        "type": "Number",
        "x": 506.66669209798175,
        "y": 368.00001017252606,
        "width": 117,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057485271,
        "type": "Number",
        "x": 224.66663106282553,
        "y": 417.3333384195964,
        "width": 118,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057507770,
        "type": "Number",
        "x": 506.66669209798175,
        "y": 392.00001017252606,
        "width": 118,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057517169,
        "type": "Number",
        "x": 507.33335876464844,
        "y": 416.6666768391927,
        "width": 117,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057525445,
        "type": "Number",
        "x": 224.66663106282553,
        "y": 443.33335876464844,
        "width": 119,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057539210,
        "type": "Number",
        "x": 223.99996439615884,
        "y": 467.33335876464844,
        "width": 119,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057548149,
        "type": "Number",
        "x": 507.33335876464844,
        "y": 442.6666768391927,
        "width": 117,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057557202,
        "type": "Number",
        "x": 506.66669209798175,
        "y": 466.6666768391927,
        "width": 118,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057569211,
        "type": "Number",
        "x": 492.0000254313151,
        "y": 498.66664632161456,
        "width": 138,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057579028,
        "type": "Number",
        "x": 492.0000254313151,
        "y": 517.3333129882812,
        "width": 140,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728057630146,
        "type": "TextField",
        "x": 445.33335876464844,
        "y": 46,
        "width": 208,
        "height": 20,
        "value": "RW- 001 ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1728069829287,
        "type": "TextField",
        "x": 445.33335876464844,
        "y": 46,
        "width": 209,
        "height": 20,
        "value": "RW- 001 ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1728073104897,
        "type": "TextField",
        "x": 455.3333333333333,
        "y": 44,
        "width": 193,
        "height": 20,
        "value": "RW- 001 ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": "debtTotalValue",
        "type": "Number",
        "x": 491.3333333333333,
        "y": 392.6666768391927,
        "width": 139,
        "height": 20,
        "value": "127024.00",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": "totalAssetsValue",
        "type": "Number",
        "x": 343.3333333333333,
        "y": 431.3333435058594,
        "width": 163,
        "height": 22,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": "totalDebtsValue",
        "type": "Number",
        "x": 344,
        "y": 450.6666768391927,
        "width": 161,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": "netWorhValue",
        "type": "Number",
        "x": 344,
        "y": 469.3333435058594,
        "width": 162,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 1728073829093,
        "type": "TextField",
        "x": 174.66666666666666,
        "y": 608.6666870117188,
        "width": 306,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 1728073895289,
        "type": "TextField",
        "x": 55.333333333333336,
        "y": 638.6666870117188,
        "width": 484,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 1728073973936,
        "type": "TextField",
        "x": 58,
        "y": 667.3333536783854,
        "width": 168,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 215,
        "type": "CheckBox",
        "x": 550,
        "y": 358.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 216,
        "type": "CheckBox",
        "x": 503.3333333333333,
        "y": 358.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 217,
        "type": "CheckBox",
        "x": 550,
        "y": 337.3333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 218,
        "type": "CheckBox",
        "x": 502.6666666666667,
        "y": 337.3333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 219,
        "type": "CheckBox",
        "x": 549.3333333333334,
        "y": 316,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 220,
        "type": "CheckBox",
        "x": 502.6666666666667,
        "y": 316,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 221,
        "type": "CheckBox",
        "x": 548.6666666666666,
        "y": 294,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 222,
        "type": "CheckBox",
        "x": 502.6666666666667,
        "y": 294,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 223,
        "type": "CheckBox",
        "x": 549.3333333333334,
        "y": 272,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 224,
        "type": "CheckBox",
        "x": 502.6666666666667,
        "y": 272,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 225,
        "type": "CheckBox",
        "x": 549.3333333333334,
        "y": 250,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 226,
        "type": "CheckBox",
        "x": 502.6666666666667,
        "y": 250,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 227,
        "type": "CheckBox",
        "x": 549.3333333333334,
        "y": 229.33333333333334,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 228,
        "type": "CheckBox",
        "x": 502.6666666666667,
        "y": 229.33333333333334,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 229,
        "type": "CheckBox",
        "x": 549.3333333333334,
        "y": 206.66666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 230,
        "type": "CheckBox",
        "x": 502,
        "y": 206.66666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 231,
        "type": "CheckBox",
        "x": 548.6666666666666,
        "y": 186,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 232,
        "type": "CheckBox",
        "x": 502,
        "y": 186,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 233,
        "type": "CheckBox",
        "x": 549.3333333333334,
        "y": 163.33333333333334,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 234,
        "type": "CheckBox",
        "x": 502,
        "y": 164.66666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 235,
        "type": "CheckBox",
        "x": 549.3333333333334,
        "y": 142,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 236,
        "type": "CheckBox",
        "x": 502,
        "y": 142.66666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 237,
        "type": "CheckBox",
        "x": 550,
        "y": 120.66666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 238,
        "type": "CheckBox",
        "x": 502,
        "y": 120.66666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 1728076533392,
        "type": "TextField",
        "x": 481.3333333333333,
        "y": 128,
        "width": 153,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 1728076563320,
        "type": "TextField",
        "x": 481.3333333333333,
        "y": 152.66666666666666,
        "width": 153,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 1728076582234,
        "type": "TextField",
        "x": 480.6666666666667,
        "y": 177.33333333333334,
        "width": "153",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 1728076587824,
        "type": "TextField",
        "x": 480.6666666666667,
        "y": 202,
        "width": "153",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 1728076597743,
        "type": "TextField",
        "x": 480.6666666666667,
        "y": 227.33333333333334,
        "width": "153",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 1728076607887,
        "type": "TextField",
        "x": 481.3333333333333,
        "y": 252,
        "width": "153",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 1728076615368,
        "type": "TextField",
        "x": 480.6666666666667,
        "y": 276.6666666666667,
        "width": "153",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 1728076742624,
        "type": "TextField",
        "x": 481.3333333333333,
        "y": 316,
        "width": 150,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 264,
        "type": "CheckBox",
        "x": 77.33333333333333,
        "y": 430.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 7
      },
      {
        "id": 265,
        "type": "CheckBox",
        "x": 77.33333333333333,
        "y": 456,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 7
      },
      {
        "id": 1728076825608,
        "type": "TextField",
        "x": 93.33333333333333,
        "y": 470.1333821614583,
        "width": 742,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 267,
        "type": "CheckBox",
        "x": 77.33333333333333,
        "y": 496.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 7
      },
      {
        "id": 1728076907012,
        "type": "TextField",
        "x": 92.66666666666667,
        "y": 512.1333821614584,
        "width": 740,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 269,
        "type": "CheckBox",
        "x": 77.33333333333333,
        "y": 538,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 7
      },
      {
        "id": 270,
        "type": "CheckBox",
        "x": 190,
        "y": 564,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 7
      },
      {
        "id": 271,
        "type": "CheckBox",
        "x": 190,
        "y": 582.6666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 7
      },
      {
        "id": 272,
        "type": "CheckBox",
        "x": 190,
        "y": 606.6666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 7
      },
      {
        "id": 273,
        "type": "CheckBox",
        "x": 190,
        "y": 626.6666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 7
      },
      {
        "id": 1728077038359,
        "type": "TextField",
        "x": 207.33333333333334,
        "y": 538.1334025065104,
        "width": 72,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 1728077060948,
        "type": "TextField",
        "x": 367.3333333333333,
        "y": 562.6666666666666,
        "width": 320,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 1728077081699,
        "type": "TextField",
        "x": 311.3333333333333,
        "y": 605.8666788736979,
        "width": 153,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 1728077099356,
        "type": "TextField",
        "x": 436.6666666666667,
        "y": 605.8666788736979,
        "width": 216,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 1728077116583,
        "type": "TextField",
        "x": 459.3333333333333,
        "y": 648.5333658854166,
        "width": 144,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 1728077136412,
        "type": "TextField",
        "x": 92,
        "y": 667.2000325520834,
        "width": 216,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 280,
        "type": "CheckBox",
        "x": 77.33333333333333,
        "y": 650.6666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 7
      },
      {
        "id": 1728077790519,
        "type": "TextField",
        "x": 51.33331807454427,
        "y": 146.0000025431315,
        "width": 197,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728077800825,
        "type": "TextField",
        "x": 52,
        "y": 170.66666666666666,
        "width": "197",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728077810819,
        "type": "TextField",
        "x": 52,
        "y": 193.33333333333334,
        "width": "197",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728077819512,
        "type": "TextField",
        "x": 52.666666666666664,
        "y": 217.33333333333334,
        "width": "197",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728077825142,
        "type": "TextField",
        "x": 52.666666666666664,
        "y": 241.33333333333334,
        "width": "197",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728077836224,
        "type": "TextField",
        "x": 52,
        "y": 264,
        "width": "197",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728077927383,
        "type": "TextField",
        "x": 51.333333333333336,
        "y": 289.3333333333333,
        "width": "197",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728077933989,
        "type": "TextField",
        "x": 50.666666666666664,
        "y": 312,
        "width": 197,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728077942028,
        "type": "TextField",
        "x": 52.666666666666664,
        "y": 336.6666666666667,
        "width": "197",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728077950633,
        "type": "TextField",
        "x": 53.333333333333336,
        "y": 359.2000020345052,
        "width": "197",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728077964615,
        "type": "TextField",
        "x": 107.33333841959636,
        "y": 474.6666564941406,
        "width": 148,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 292,
        "type": "CheckBox",
        "x": 42,
        "y": 476,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 8
      },
      {
        "id": 1728078005929,
        "type": "TextField",
        "x": 492.66669209798175,
        "y": 394.000005086263,
        "width": 137,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078026447,
        "type": "TextField",
        "x": 493.33335876464844,
        "y": 412.66669209798175,
        "width": 138,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078052116,
        "type": "TextField",
        "x": 193.33333333333334,
        "y": 359.3333333333333,
        "width": "320",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078057833,
        "type": "TextField",
        "x": 193.33333333333334,
        "y": 336,
        "width": "320",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078063055,
        "type": "TextField",
        "x": 193.33333333333334,
        "y": 312,
        "width": "320",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078073179,
        "type": "TextField",
        "x": 193.33333333333334,
        "y": 288,
        "width": "320",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078081445,
        "type": "TextField",
        "x": 192.66666666666666,
        "y": 265.3333333333333,
        "width": "320",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078088463,
        "type": "TextField",
        "x": 193.33333333333334,
        "y": 241.33333333333334,
        "width": "320",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078100315,
        "type": "TextField",
        "x": 192.66666666666666,
        "y": 216.66666666666666,
        "width": "320",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078106423,
        "type": "TextField",
        "x": 192.66666666666666,
        "y": 192.66666666666666,
        "width": "320",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078111741,
        "type": "TextField",
        "x": 192.66666666666666,
        "y": 170,
        "width": "320",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078122386,
        "type": "TextField",
        "x": 192.6666514078776,
        "y": 146.6666692097982,
        "width": 320,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078132529,
        "type": "TextField",
        "x": 419.33335876464844,
        "y": 358.6666895548503,
        "width": 112,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078145436,
        "type": "TextField",
        "x": 418.66669209798175,
        "y": 335.33335876464844,
        "width": 112,
        "height": "20",
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078167088,
        "type": "TextField",
        "x": 419.3333333333333,
        "y": 312.6666666666667,
        "width": "112",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078174211,
        "type": "TextField",
        "x": 420,
        "y": 289.3333333333333,
        "width": "112",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078179291,
        "type": "TextField",
        "x": 420,
        "y": 265.3333333333333,
        "width": "112",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078193056,
        "type": "TextField",
        "x": 420,
        "y": 240.66666666666666,
        "width": "112",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078199800,
        "type": "TextField",
        "x": 419.3333333333333,
        "y": 217.33333333333334,
        "width": 112,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078208012,
        "type": "TextField",
        "x": 419.3333333333333,
        "y": 193.33333333333334,
        "width": 112,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078216711,
        "type": "TextField",
        "x": 419.3333333333333,
        "y": 170,
        "width": "112",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078228694,
        "type": "TextField",
        "x": 419.3333333333333,
        "y": 145.33333333333334,
        "width": "112",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078460946,
        "type": "TextField",
        "x": 508.0000254313151,
        "y": 358.6666895548503,
        "width": 113,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078480815,
        "type": "TextField",
        "x": 506.6666666666667,
        "y": 336,
        "width": "113",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078487897,
        "type": "TextField",
        "x": 506.6666666666667,
        "y": 312.6666666666667,
        "width": "113",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078502925,
        "type": "TextField",
        "x": 506.6666666666667,
        "y": 288.6666666666667,
        "width": "113",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078511448,
        "type": "TextField",
        "x": 507.3333333333333,
        "y": 264.6666666666667,
        "width": "113",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078519860,
        "type": "TextField",
        "x": 506.6666666666667,
        "y": 241.33333333333334,
        "width": "113",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078529171,
        "type": "TextField",
        "x": 507.3333333333333,
        "y": 216,
        "width": 113,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078538210,
        "type": "TextField",
        "x": 507.3333333333333,
        "y": 193.33333333333334,
        "width": "113",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078546662,
        "type": "TextField",
        "x": 507.3333333333333,
        "y": 169.33333333333334,
        "width": "113",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728078552296,
        "type": "TextField",
        "x": 507.3333333333333,
        "y": 146,
        "width": "113",
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": "assetsTotalsField",
        "type": "Number",
        "x": 495.3333333333333,
        "y": 681.3333333333334,
        "width": 132,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1728374830596,
        "type": "TextField",
        "x": 169,
        "y": 587,
        "width": 460,
        "height": 20,
        "value": "Landour Avenue ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4,
        "bind": "assets[0].address",
        "source": "realEstate"
      },
      {
        "id": 1728374830597,
        "type": "Number",
        "x": 493,
        "y": 587,
        "width": 135,
        "height": 20,
        "value": "450000",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4,
        "bind": "assets[0].today",
        "source": "realEstate"
      },
      {
        "id": 1728374830599,
        "type": "TextField",
        "x": 169,
        "y": 606,
        "width": 460,
        "height": 20,
        "value": "Islington street, Ontario ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4,
        "bind": "assets[1].address",
        "source": "realEstate"
      },
      {
        "id": 1728374830600,
        "type": "Number",
        "x": 493,
        "y": 606,
        "width": 135,
        "height": 20,
        "value": "840000",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4,
        "bind": "assets[1].today",
        "source": "realEstate"
      },
      {
        "id": 1728374830602,
        "type": "TextField",
        "x": 169,
        "y": 625,
        "width": 460,
        "height": 20,
        "value": "1233 Dummy Road",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4,
        "bind": "assets[2].address",
        "source": "realEstate"
      },
      {
        "id": 1728374830603,
        "type": "Number",
        "x": 493,
        "y": 625,
        "width": 135,
        "height": 20,
        "value": "1234500",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4,
        "bind": "assets[2].today",
        "source": "realEstate"
      },
      {
        "id": 1728374831101,
        "type": "TextField",
        "x": 169,
        "y": 655,
        "width": 460,
        "height": 20,
        "value": "Ford ranger",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4,
        "bind": "assets[0].description",
        "source": "houseHold"
      },
      {
        "id": 1728374831102,
        "type": "Number",
        "x": 493,
        "y": 655,
        "width": 135,
        "height": 20,
        "value": "250000",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4,
        "bind": "assets[0].today",
        "source": "houseHold"
      },
      {
        "id": 1728374831104,
        "type": "TextField",
        "x": 169,
        "y": 674,
        "width": 460,
        "height": 20,
        "value": "Art items ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4,
        "bind": "assets[1].description",
        "source": "houseHold"
      },
      {
        "id": 1728374831105,
        "type": "Number",
        "x": 493,
        "y": 674,
        "width": 135,
        "height": 20,
        "value": "50000",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4,
        "bind": "assets[1].today",
        "source": "houseHold"
      },
      {
        "id": 1728374831107,
        "type": "TextField",
        "x": 169,
        "y": 693,
        "width": 460,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4,
        "bind": "assets[2].description",
        "source": "houseHold"
      },
      {
        "id": 1728374831108,
        "type": "Number",
        "x": 493,
        "y": 693,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4,
        "bind": "assets[2].today",
        "source": "houseHold"
      },
      {
        "id": 1728374835951,
        "type": "TextField",
        "x": 166,
        "y": 389,
        "width": 460,
        "height": 20,
        "value": "Children",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[0].category",
        "source": "lifeInsurance"
      },
      {
        "id": 1728374835952,
        "type": "Number",
        "x": 493,
        "y": "389",
        "width": 135,
        "height": 20,
        "value": "11295.98",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[0].today",
        "source": "lifeInsurance"
      },
      {
        "id": 1728374835954,
        "type": "TextField",
        "x": 166,
        "y": 408,
        "width": 460,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[1].category",
        "source": "lifeInsurance"
      },
      {
        "id": 1728374835956,
        "type": "Number",
        "x": 493,
        "y": 408,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[1].today",
        "source": "lifeInsurance"
      },
      {
        "id": 1728374835958,
        "type": "TextField",
        "x": 166,
        "y": 427,
        "width": 460,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[2].category",
        "source": "lifeInsurance"
      },
      {
        "id": 1728374835959,
        "type": "Number",
        "x": 493,
        "y": 427,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[2].today",
        "source": "lifeInsurance"
      },
      {
        "id": 1728374837078,
        "type": "TextField",
        "x": 166,
        "y": 242,
        "width": 460,
        "height": 20,
        "value": "Bank of Montreal",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[0].category",
        "source": "bank"
      },
      {
        "id": 1728374837079,
        "type": "Number",
        "x": 493,
        "y": 242,
        "width": 135,
        "height": 20,
        "value": "12930",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[0].today",
        "source": "bank"
      },
      {
        "id": 1728374837081,
        "type": "TextField",
        "x": 166,
        "y": 261,
        "width": 460,
        "height": 20,
        "value": "Bank of Montreal ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[1].category",
        "source": "bank"
      },
      {
        "id": 1728374837082,
        "type": "Number",
        "x": 493,
        "y": 261,
        "width": 135,
        "height": 20,
        "value": "17257",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[1].today",
        "source": "bank"
      },
      {
        "id": 1728374837084,
        "type": "TextField",
        "x": 166,
        "y": 280,
        "width": 460,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[2].category",
        "source": "bank"
      },
      {
        "id": 1728374837085,
        "type": "Number",
        "x": 493,
        "y": 280,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[2].today",
        "source": "bank"
      },
      {
        "id": 1728374837587,
        "type": "TextField",
        "x": 166,
        "y": 462,
        "width": 460,
        "height": 20,
        "value": "CloudAct",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[0].firm_name",
        "source": "interests"
      },
      {
        "id": 1728374837588,
        "type": "Number",
        "x": 493,
        "y": 462,
        "width": 135,
        "height": 20,
        "value": "1234500",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[0].today",
        "source": "interests"
      },
      {
        "id": 1728374837590,
        "type": "TextField",
        "x": 166,
        "y": 481,
        "width": 460,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[1].firm_name",
        "source": "interests"
      },
      {
        "id": 1728374837591,
        "type": "Number",
        "x": 493,
        "y": 481,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[1].today",
        "source": "interests"
      },
      {
        "id": 1728374837593,
        "type": "TextField",
        "x": 166,
        "y": 500,
        "width": 460,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[2].firm_name",
        "source": "interests"
      },
      {
        "id": 1728374837594,
        "type": "Number",
        "x": 493,
        "y": 500,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[2].today",
        "source": "interests"
      },
      {
        "id": 1728374838007,
        "type": "TextField",
        "x": 166,
        "y": 536,
        "width": 460,
        "height": 20,
        "value": "Gert Owes",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[0].category",
        "source": "moneyOwed"
      },
      {
        "id": 1728374838008,
        "type": "Number",
        "x": 493,
        "y": 536,
        "width": 135,
        "height": 20,
        "value": "31335",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[0].today",
        "source": "moneyOwed"
      },
      {
        "id": 1728374838010,
        "type": "TextField",
        "x": 166,
        "y": 555,
        "width": 460,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[1].category",
        "source": "moneyOwed"
      },
      {
        "id": 1728374838011,
        "type": "Number",
        "x": 493,
        "y": 555,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[1].today",
        "source": "moneyOwed"
      },
      {
        "id": 1728374838013,
        "type": "TextField",
        "x": 166,
        "y": 574,
        "width": 460,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[2].category",
        "source": "moneyOwed"
      },
      {
        "id": 1728374838014,
        "type": "Number",
        "x": 493,
        "y": 574,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[2].today",
        "source": "moneyOwed"
      },
      {
        "id": 1728374838451,
        "type": "TextField",
        "x": 166,
        "y": 94,
        "width": 460,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[0].address",
        "source": "otherPossessions"
      },
      {
        "id": 1728374838452,
        "type": "Number",
        "x": 493,
        "y": 94,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[0].today",
        "source": "otherPossessions"
      },
      {
        "id": 1728374838454,
        "type": "TextField",
        "x": 166,
        "y": 113,
        "width": 460,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[1].address",
        "source": "otherPossessions"
      },
      {
        "id": 1728374838455,
        "type": "Number",
        "x": 493,
        "y": 113,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[1].today",
        "source": "otherPossessions"
      },
      {
        "id": 1728374838457,
        "type": "TextField",
        "x": 166,
        "y": 132,
        "width": 460,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[2].address",
        "source": "otherPossessions"
      },
      {
        "id": 1728374838458,
        "type": "Number",
        "x": 493,
        "y": 132,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[2].today",
        "source": "otherPossessions"
      },
      {
        "id": 1728374839305,
        "type": "TextField",
        "x": 166,
        "y": 167,
        "width": 460,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[0].type",
        "source": "investments"
      },
      {
        "id": 1728374839306,
        "type": "Number",
        "x": 493,
        "y": 167,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[0].today",
        "source": "investments"
      },
      {
        "id": 1728374839308,
        "type": "TextField",
        "x": 166,
        "y": 186,
        "width": 460,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[1].type",
        "source": "investments"
      },
      {
        "id": 1728374839309,
        "type": "Number",
        "x": 493,
        "y": 186,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[1].today",
        "source": "investments"
      },
      {
        "id": 1728374839311,
        "type": "TextField",
        "x": 166,
        "y": 205,
        "width": 460,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[2].type",
        "source": "investments"
      },
      {
        "id": 1728374839312,
        "type": "Number",
        "x": 493,
        "y": 205,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[2].today",
        "source": "investments"
      },
      {
        "id": 1728374839750,
        "type": "TextField",
        "x": 166,
        "y": 315,
        "width": 460,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[0].description",
        "source": "savings"
      },
      {
        "id": 1728374839751,
        "type": "Number",
        "x": 493,
        "y": 315,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[0].today",
        "source": "savings"
      },
      {
        "id": 1728374839754,
        "type": "TextField",
        "x": 166,
        "y": 334,
        "width": 460,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[1].description",
        "source": "savings"
      },
      {
        "id": 1728374839755,
        "type": "Number",
        "x": 493,
        "y": 334,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[1].today",
        "source": "savings"
      },
      {
        "id": 1728374839757,
        "type": "TextField",
        "x": 166,
        "y": 353,
        "width": 460,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[2].description",
        "source": "savings"
      },
      {
        "id": 1728374839758,
        "type": "Number",
        "x": 493,
        "y": 353,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[2].today",
        "source": "savings"
      },
      {
        "id": 1728374840429,
        "type": "TextField",
        "x": 166,
        "y": 610,
        "width": 460,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[0].description",
        "source": "Other"
      },
      {
        "id": 1728374840430,
        "type": "Number",
        "x": 493,
        "y": 610,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[0].today",
        "source": "Other"
      },
      {
        "id": 1728374840432,
        "type": "TextField",
        "x": 166,
        "y": 629,
        "width": 460,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[1].description",
        "source": "Other"
      },
      {
        "id": 1728374840433,
        "type": "Number",
        "x": 493,
        "y": 629,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[1].today",
        "source": "Other"
      },
      {
        "id": 1728374840435,
        "type": "TextField",
        "x": 166,
        "y": 648,
        "width": 460,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[2].description",
        "source": "Other"
      },
      {
        "id": 1728374840436,
        "type": "Number",
        "x": 493,
        "y": 648,
        "width": 135,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "bind": "assets[2].today",
        "source": "Other"
      },
      {
        "id": "mortgages-23-0",
        "type": "TextField",
        "x": 130,
        "y": 120,
        "width": 276,
        "height": 20,
        "value": "bank Loan",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "mortgages[0].details",
        "source": "debts"
      },
      {
        "id": "mortgages-23-1",
        "type": "Number",
        "x": 335,
        "y": 120,
        "width": 105,
        "height": 20,
        "value": "5000",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "mortgages[0].on_valuation_date",
        "source": "debts"
      },
      {
        "id": "mortgages-23-2",
        "type": "Number",
        "x": 419,
        "y": 120,
        "width": 105,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "mortgages[0].monthlyPayment",
        "source": "debts"
      },
      {
        "id": "mortgages-49-3",
        "type": "TextField",
        "x": 130,
        "y": 141,
        "width": 276,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "mortgages[1].details",
        "source": "debts"
      },
      {
        "id": "mortgages-49-4",
        "type": "Number",
        "x": 335,
        "y": 141,
        "width": 105,
        "height": 20,
        "value": "94,024",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "mortgages[1].on_valuation_date",
        "source": "debts"
      },
      {
        "id": "mortgages-49-5",
        "type": "Number",
        "x": 419,
        "y": 141,
        "width": 105,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "mortgages[1].monthlyPayment",
        "source": "debts"
      },
      {
        "id": "lineofcredits-21-0",
        "type": "TextField",
        "x": 130.66666666666666,
        "y": 164,
        "width": 276,
        "height": 20,
        "value": "Credit card ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "lineofcredits[0].details",
        "source": "debts"
      },
      {
        "id": "lineofcredits-21-1",
        "type": "Number",
        "x": 334.3333333333333,
        "y": 164.66666666666666,
        "width": 105,
        "height": 20,
        "value": "5000",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "lineofcredits[0].on_valuation_date",
        "source": "debts"
      },
      {
        "id": "lineofcredits-21-2",
        "type": "Number",
        "x": 419.6666666666667,
        "y": 163.33333333333334,
        "width": 105,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "lineofcredits[0].monthlyPayment",
        "source": "debts"
      },
      {
        "id": "otherloans-32-0",
        "type": "TextField",
        "x": 130,
        "y": 316,
        "width": 276,
        "height": 20,
        "value": "bank Loan",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "otherloans[0].details",
        "source": "debts"
      },
      {
        "id": "otherloans-32-1",
        "type": "Number",
        "x": 333,
        "y": 316,
        "width": 105,
        "height": 20,
        "value": "5000",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "otherloans[0].on_valuation_date",
        "source": "debts"
      },
      {
        "id": "otherloans-32-2",
        "type": "Number",
        "x": 419.6666666666667,
        "y": 316,
        "width": 105,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "otherloans[0].monthlyPayment",
        "source": "debts"
      },
      {
        "id": "outstandingcreditcardbalances-47-0",
        "type": "TextField",
        "x": 130,
        "y": 186,
        "width": 276,
        "height": 20,
        "value": "outstanding credit",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "outstandingcreditcardbalances[0].details",
        "source": "debts"
      },
      {
        "id": "outstandingcreditcardbalances-47-1",
        "type": "Number",
        "x": 333.6666666666667,
        "y": 186.66666666666666,
        "width": 105,
        "height": 20,
        "value": "6000",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "outstandingcreditcardbalances[0].on_valuation_date",
        "source": "debts"
      },
      {
        "id": "outstandingcreditcardbalances-47-2",
        "type": "Number",
        "x": 420.3333333333333,
        "y": 186,
        "width": 105,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "outstandingcreditcardbalances[0].monthlyPayment",
        "source": "debts"
      },
      {
        "id": "unpaidsupportamounts-48-0",
        "type": "TextField",
        "x": 129.33333333333334,
        "y": 251.33333333333334,
        "width": 276,
        "height": 20,
        "value": "unssuported",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "unpaidsupportamounts[0].details",
        "source": "debts"
      },
      {
        "id": "unpaidsupportamounts-48-1",
        "type": "Number",
        "x": 332.3333333333333,
        "y": 250.66666666666666,
        "width": 105,
        "height": 20,
        "value": "6000",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "unpaidsupportamounts[0].on_valuation_date",
        "source": "debts"
      },
      {
        "id": "unpaidsupportamounts-48-2",
        "type": "Number",
        "x": 419.6666666666667,
        "y": 250.66666666666666,
        "width": 105,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "unpaidsupportamounts[0].monthlyPayment",
        "source": "debts"
      },
      {
        "id": "otherdebts-50-0",
        "type": "TextField",
        "x": 130,
        "y": 336.6666666666667,
        "width": 276,
        "height": 20,
        "value": "other debts",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "otherdebts[0].details",
        "source": "debts"
      },
      {
        "id": "otherdebts-50-1",
        "type": "Number",
        "x": 333.6666666666667,
        "y": 338,
        "width": 105,
        "height": 20,
        "value": "6000",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "otherdebts[0].on_valuation_date",
        "source": "debts"
      },
      {
        "id": "otherdebts-50-2",
        "type": "Number",
        "x": 420.3333333333333,
        "y": 336.6666666666667,
        "width": 105,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "bind": "otherdebts[0].monthlyPayment",
        "source": "debts"
      }
    ]
  }

  if (formType === 'Form13_1') {
    staticFields = [
      {
        "id": 1728123655411,
        "type": "TextField",
        "x": 446,
        "y": 56,
        "width": 210,
        "height": 20,
        "value": "Court File Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728123673151,
        "type": "TextField",
        "x": 54.666666666666664,
        "y": 53.333333333333336,
        "width": 562,
        "height": 24,
        "value": "Name of Court",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728123694459,
        "type": "TextField",
        "x": 54.666666666666664,
        "y": 84,
        "width": 560,
        "height": 20,
        "value": "Court office address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728123711875,
        "type": "TextField",
        "x": 70.66666666666667,
        "y": 196,
        "width": 150,
        "height": 20,
        "value": "Applicant(s) Email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728123713211,
        "type": "TextField",
        "x": 96,
        "y": 182.00000508626303,
        "width": 311,
        "height": 20,
        "value": "Applicant(s) Phone & Fax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728123713707,
        "type": "TextField",
        "x": 80,
        "y": 166.00000508626303,
        "width": 336,
        "height": 20,
        "value": "Applicant(s) Address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728123714059,
        "type": "TextField",
        "x": 108,
        "y": 151.33333841959634,
        "width": 293,
        "height": 20,
        "value": "Applicant(s) Full Legal name",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728123786331,
        "type": "TextField",
        "x": 353.3333333333333,
        "y": 196.6666717529297,
        "width": 351,
        "height": 20,
        "value": "Applicant(s) Lawyer Email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728123786648,
        "type": "TextField",
        "x": 378.6666666666667,
        "y": 181.33333841959634,
        "width": 313,
        "height": 20,
        "value": "Applicant(s) Lawyer Phone & fax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728123787019,
        "type": "TextField",
        "x": 364,
        "y": 165.99998474121094,
        "width": 336,
        "height": 20,
        "value": "Applicant(s) Lawyer Address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728123787363,
        "type": "TextField",
        "x": 392.6666666666667,
        "y": 151.33331807454428,
        "width": 294,
        "height": 20,
        "value": "Applicant(s) Lawyer Full legal name",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728123856847,
        "type": "TextField",
        "x": 356,
        "y": 271.3333384195964,
        "width": 347,
        "height": 20,
        "value": "Respondent(s) Lawyer  Email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728123857247,
        "type": "TextField",
        "x": 381.3333333333333,
        "y": 256.000005086263,
        "width": 310,
        "height": 20,
        "value": "Respondent(s) Lawyer  Phone & fax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728123857611,
        "type": "TextField",
        "x": 364,
        "y": 242.00000508626303,
        "width": 335,
        "height": 20,
        "value": "Respondent(s) Lawyer  Address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728123857959,
        "type": "TextField",
        "x": 394.6666666666667,
        "y": 226.6666717529297,
        "width": 289,
        "height": 20,
        "value": "Respondent(s) Lawyer Full legal name",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728123964034,
        "type": "TextField",
        "x": 96,
        "y": 256.000005086263,
        "width": 311,
        "height": 20,
        "value": "Respondent(s) Phone & Fax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728123964338,
        "type": "TextField",
        "x": 80,
        "y": 241.33331807454428,
        "width": 335,
        "height": 20,
        "value": "Respondent(s) Address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728123964694,
        "type": "TextField",
        "x": 109.33333333333333,
        "y": 226.6666717529297,
        "width": 291,
        "height": 20,
        "value": "Respondent(s) Full legal name ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728123965062,
        "type": "TextField",
        "x": 74.66666666666667,
        "y": 271.33331807454425,
        "width": 342,
        "height": 20,
        "value": "Respondent(s) Email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 20,
        "type": "CheckBox",
        "x": 74.66666666666667,
        "y": 601.3333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 21,
        "type": "CheckBox",
        "x": 74,
        "y": 664.6666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 22,
        "type": "CheckBox",
        "x": 74,
        "y": 634.0000203450521,
        "width": 20,
        "height": 18,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 23,
        "type": "CheckBox",
        "x": 49.333333333333336,
        "y": 299.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 24,
        "type": "CheckBox",
        "x": 133.33333333333334,
        "y": 300.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1728124115863,
        "type": "TextField",
        "x": 198.66666666666666,
        "y": 518.8888956705729,
        "width": 586,
        "height": 20,
        "value": "My name is (full legal name)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728124119206,
        "type": "TextField",
        "x": 214.66666666666666,
        "y": 536,
        "width": 561,
        "height": 20,
        "value": "I live in (municipality & province)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 27,
        "type": "CheckBox",
        "x": 74,
        "y": 80.66666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 28,
        "type": "CheckBox",
        "x": 191.33333333333334,
        "y": 80.66666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 29,
        "type": "CheckBox",
        "x": 334.6666666666667,
        "y": 81.33333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1728124203647,
        "type": "TextField",
        "x": 440.6666666666667,
        "y": 45.33331807454427,
        "width": 215,
        "height": 20,
        "value": "Court file number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 31,
        "type": "CheckBox",
        "x": 434.6666666666667,
        "y": 82,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 32,
        "type": "CheckBox",
        "x": 74,
        "y": 98,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 33,
        "type": "CheckBox",
        "x": 74,
        "y": 114.66666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 34,
        "type": "CheckBox",
        "x": 74.66666666666667,
        "y": 130.66666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 35,
        "type": "CheckBox",
        "x": 76,
        "y": 176.66666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1728124257074,
        "type": "TextField",
        "x": 304,
        "y": 145.33333333333334,
        "width": 150,
        "height": 20,
        "value": "all sources was $ ......",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 37,
        "type": "CheckBox",
        "x": 76,
        "y": 332.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1728124301315,
        "type": "TextField",
        "x": 470,
        "y": 688.4444427490234,
        "width": "171",
        "height": 20,
        "value": "13. Total monthly income x 12 = Total annual income",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728124301603,
        "type": "TextField",
        "x": 468.6666666666667,
        "y": 470.22222900390625,
        "width": "171",
        "height": 20,
        "value": "3. Self-employment income (Monthly...",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728124301931,
        "type": "TextField",
        "x": 468.6666666666667,
        "y": 672.6666666666666,
        "width": "171",
        "height": "20",
        "value": "12. Total monthly income from all sources",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728124302251,
        "type": "TextField",
        "x": 469.3333333333333,
        "y": 622,
        "width": "171",
        "height": 20,
        "value": "10. Child Tax Benefits or Tax Rebates (e.g GST)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728124302543,
        "type": "TextField",
        "x": 468.6666666666667,
        "y": 579.3333333333334,
        "width": "171",
        "height": 20,
        "value": "8. Pension income (including CPP and OAS)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728124302827,
        "type": "TextField",
        "x": 468,
        "y": 601.3333333333334,
        "width": "171",
        "height": 20,
        "value": "9. Spousal support received from a former spouse/partner",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728124303111,
        "type": "TextField",
        "x": 468.6666666666667,
        "y": 650,
        "width": "171",
        "height": 20,
        "value": "11. Other sources of income (e.g RRSP withdrawals, capital gains) (*attached Schedule A and divide annual amount by 12)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728124303414,
        "type": "TextField",
        "x": 468,
        "y": 535.3333333333334,
        "width": "171",
        "height": 20,
        "value": "6. Social assistance income (including ODSP payments)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728124303671,
        "type": "TextField",
        "x": 468.6666666666667,
        "y": 558,
        "width": "171",
        "height": 20,
        "value": "7. Interest and investment income",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728124303955,
        "type": "TextField",
        "x": 468.6666666666667,
        "y": 514,
        "width": 171,
        "height": 20,
        "value": "5. Workers compensation benefits",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728124304251,
        "type": "TextField",
        "x": 468.6666666666667,
        "y": 491.3333333333333,
        "width": "171",
        "height": 20,
        "value": "4. Employment Insurance benefits",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728124304531,
        "type": "TextField",
        "x": 468.6666666666667,
        "y": 448,
        "width": "171",
        "height": 20,
        "value": "2. Commissions, tips and bonuses",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728124304839,
        "type": "TextField",
        "x": 469.3333333333333,
        "y": 426,
        "width": 171,
        "height": 20,
        "value": "1. Employment income (before deductions)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728124696110,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 36,
        "y": 124.00000699361165,
        "width": 825,
        "height": 132,
        "data": [
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 1728124723338,
        "type": "TextField",
        "x": 440.6666666666667,
        "y": 46.666666666666664,
        "width": 213,
        "height": 20,
        "value": "Court file number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124754026,
        "type": "TextField",
        "x": 223.33333333333334,
        "y": 358,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Automatic Deductions Employee pension contribution",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124754362,
        "type": "TextField",
        "x": 222.66666666666666,
        "y": 334.6666666666667,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Automatic Deductions Income taxes",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124754678,
        "type": "TextField",
        "x": 223.33333333333334,
        "y": 310,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Automatic Deductions EI premiums",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124754898,
        "type": "TextField",
        "x": 223.33333333333334,
        "y": 288,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Automatic Deductions CPP contributions",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124755098,
        "type": "TextField",
        "x": 506,
        "y": 404,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Transportation Car loan or lease payments",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124755410,
        "type": "TextField",
        "x": 506,
        "y": 382,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Transportation Parking",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124755534,
        "type": "TextField",
        "x": 505.3333333333333,
        "y": 358,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Transportation Repairs and maintenance",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124755706,
        "type": "TextField",
        "x": 505.3333333333333,
        "y": 334,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Transportation Car insurance and license",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124755850,
        "type": "TextField",
        "x": 504.6666666666667,
        "y": 310.6666666666667,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Transportation Gas and oil",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124755994,
        "type": "TextField",
        "x": 505.3333333333333,
        "y": 286.6666666666667,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Transportation Public transit, taxis",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124831958,
        "type": "TextField",
        "x": 224,
        "y": 478.6666666666667,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Housing Property Taxes",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124832126,
        "type": "TextField",
        "x": 505.3333333333333,
        "y": 548.6666666666666,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Health Eye care",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124832325,
        "type": "TextField",
        "x": 223.33333333333334,
        "y": 404.6666666666667,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Automatic Deductions Subtotal",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124832521,
        "type": "TextField",
        "x": 223.33333333333334,
        "y": 381.3333333333333,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Automatic Deductions Union dues",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124853382,
        "type": "TextField",
        "x": 224,
        "y": 454.6666666666667,
        "width": 119,
        "height": 20,
        "value": "Part 2 Expenses Housing Rent or mortgage",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124853517,
        "type": "TextField",
        "x": 505.3333333333333,
        "y": 526,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Health Medicine and drugs",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124853637,
        "type": "TextField",
        "x": 506,
        "y": 502,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Health Dental expenses",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124853841,
        "type": "TextField",
        "x": 506,
        "y": 478.6666666666667,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Health Health insurance premiums",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124853993,
        "type": "TextField",
        "x": 506,
        "y": 429.3333333333333,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Transportation Subtotal ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124854117,
        "type": "TextField",
        "x": 505.3333333333333,
        "y": 572.6666666666666,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Health Subtotal",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124922014,
        "type": "TextField",
        "x": 224,
        "y": 645.3333333333334,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Utilities Heat",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124922501,
        "type": "TextField",
        "x": 224,
        "y": 669.3333333333334,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Utilities Electricity",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124922917,
        "type": "TextField",
        "x": 504.6666666666667,
        "y": 645.7777709960938,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Personal Hair care and beauty",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124923357,
        "type": "TextField",
        "x": 224,
        "y": 621.3333333333334,
        "width": 119,
        "height": 20,
        "value": "Part 2 Expenses Utilities Water",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124923765,
        "type": "TextField",
        "x": 506.6666666666667,
        "y": 621.3333333333334,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Personal Clothing",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124924137,
        "type": "TextField",
        "x": 224,
        "y": 572.6666666666666,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Housing Subtotal",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124924526,
        "type": "TextField",
        "x": 224,
        "y": 550,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Housing Repairs and maintenance",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124924909,
        "type": "TextField",
        "x": 505.3333333333333,
        "y": 669.3333333333334,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Personal Alcohol and tobacco",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124925293,
        "type": "TextField",
        "x": 223.33333333333334,
        "y": 526.4444376627604,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Housing Condominium fees",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728124925561,
        "type": "TextField",
        "x": 224,
        "y": 502,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Housing Property insurance",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728125479933,
        "type": "TextField",
        "x": 439.3333333333333,
        "y": 46.6666514078776,
        "width": 218,
        "height": 20,
        "value": "Court file number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125497429,
        "type": "TextField",
        "x": 505.3333333333333,
        "y": 336,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Other expenses Debt payments",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125497885,
        "type": "TextField",
        "x": 505.3333333333333,
        "y": 318.00000317891437,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Other expenses Summer camp expenses",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125498093,
        "type": "TextField",
        "x": 504.6666666666667,
        "y": 297.3333333333333,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Other expenses Children's activities",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125498253,
        "type": "TextField",
        "x": 505.3333333333333,
        "y": 276,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Other expenses Clothing for children",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125498401,
        "type": "TextField",
        "x": 506,
        "y": 254.00000190734863,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Other expenses School Fees and supplies",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125498521,
        "type": "TextField",
        "x": 505.3333333333333,
        "y": 233.33333333333334,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Other expenses Vacations",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125498657,
        "type": "TextField",
        "x": 505.3333333333333,
        "y": 211.33333333333334,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Other expenses RRSP/RESP withdrawals",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125498809,
        "type": "TextField",
        "x": 505.3333333333333,
        "y": 192.66666666666666,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Other expenses Life Insurance premiums",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125498945,
        "type": "TextField",
        "x": 506,
        "y": 156,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Personal Subtotal",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125499085,
        "type": "TextField",
        "x": 505.3333333333333,
        "y": 134,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Personal Gifts",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125499261,
        "type": "TextField",
        "x": 506,
        "y": 109.33333333333333,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Personal Entertainment/recreation (including children)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125499401,
        "type": "TextField",
        "x": 505.3333333333333,
        "y": 82.66666666666667,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Personal Education (specify)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125562389,
        "type": "TextField",
        "x": 222.66666666666666,
        "y": 156,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Utilities Internet",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125562565,
        "type": "TextField",
        "x": 222.66666666666666,
        "y": 134.66666666666666,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Utilities Cable",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125562729,
        "type": "TextField",
        "x": 223.33333333333334,
        "y": 110,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Utilities Cell phone",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125562905,
        "type": "TextField",
        "x": 222.66666666666666,
        "y": 84,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Utilities Telephone",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125563065,
        "type": "TextField",
        "x": 505.3333333333333,
        "y": 377.55555216471356,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Other expenses Other expenses not shown above (specify)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125563368,
        "type": "TextField",
        "x": 505.3333333333333,
        "y": 356.6666666666667,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Other expenses Support paid for other children",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125621236,
        "type": "TextField",
        "x": 222.66666666666666,
        "y": 318,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Household Expenses Subtotal",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125621521,
        "type": "TextField",
        "x": 222.66666666666666,
        "y": 298.6666666666667,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Household Expenses Laundry and Dry Cleaning ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125621680,
        "type": "TextField",
        "x": 222.66666666666666,
        "y": 276,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Household Expenses Pet care",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125621844,
        "type": "TextField",
        "x": 223.33333333333334,
        "y": 254,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Household Expenses Meals outside the home",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125622012,
        "type": "TextField",
        "x": 222.66666666666666,
        "y": 232.66666666666666,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Household Expenses Household supplies",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125622168,
        "type": "TextField",
        "x": 223.33333333333334,
        "y": 211.33333333333334,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Household Expenses Groceries ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125622505,
        "type": "TextField",
        "x": 222.66666666666666,
        "y": 175.33333333333334,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Utilities Subtotal",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125660993,
        "type": "TextField",
        "x": 491.3333333333333,
        "y": 447.7777913411458,
        "width": "137",
        "height": 20,
        "value": "Part 2 Expenses Total Amount of Yearly Expenses",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125661293,
        "type": "TextField",
        "x": 492,
        "y": 428.6666666666667,
        "width": "137",
        "height": 20,
        "value": "Part 2 Expenses Total Amount of Monthly Expenses",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125661584,
        "type": "TextField",
        "x": 223.33333333333334,
        "y": 398.6666666666667,
        "width": 119,
        "height": 20,
        "value": "Part 2 Expenses Childcare costs Subtotal",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125661961,
        "type": "TextField",
        "x": 505.3333333333333,
        "y": 399.3333333333333,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Other expenses Subtotal",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125662309,
        "type": "TextField",
        "x": 222.66666666666666,
        "y": 378.6666666666667,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Childcare costs Babysitting costs",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728125662552,
        "type": "TextField",
        "x": 222.66666666666666,
        "y": 356,
        "width": "119",
        "height": 20,
        "value": "Part 2 Expenses Childcare costs Daycare expense",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 115,
        "type": "CheckBox",
        "x": 57.333333333333336,
        "y": 510,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 116,
        "type": "CheckBox",
        "x": 57.333333333333336,
        "y": 529.3333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 117,
        "type": "CheckBox",
        "x": 56.666666666666664,
        "y": 546.6666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 118,
        "type": "CheckBox",
        "x": 58,
        "y": 562.6666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 119,
        "type": "CheckBox",
        "x": 154,
        "y": 582,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 120,
        "type": "CheckBox",
        "x": 154,
        "y": 595.3333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 121,
        "type": "CheckBox",
        "x": 153.33333333333334,
        "y": 612.6666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 122,
        "type": "CheckBox",
        "x": 153.33333333333334,
        "y": 626.6666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 1728126385116,
        "type": "TextField",
        "x": 474.6666666666667,
        "y": 640.8888956705729,
        "width": 168,
        "height": 20,
        "value": "per ....",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728126385436,
        "type": "TextField",
        "x": 373.3333333333333,
        "y": 640.8888956705729,
        "width": 120,
        "height": 20,
        "value": "7 My spouse/partner .... contributes about $",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728126385804,
        "type": "TextField",
        "x": 180.66666666666666,
        "y": 561.3333333333334,
        "width": 64,
        "height": 20,
        "value": "4 I/we have (givne number) .... child(ren) who live(s) in the home.",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728126386148,
        "type": "TextField",
        "x": 324,
        "y": 579.3333333333334,
        "width": 383,
        "height": 20,
        "value": "5 My spouse/partner work at (place of work or business)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728126386508,
        "type": "TextField",
        "x": 259.3333333333333,
        "y": 544,
        "width": 482,
        "height": 20,
        "value": "3 I/we live the following other adult(s)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728126386845,
        "type": "TextField",
        "x": 382.6666666666667,
        "y": 525.3333333333334,
        "width": 294,
        "height": 20,
        "value": "2. I am living with (full legal name of person your are married to or cohabiting with",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728126387148,
        "type": "TextField",
        "x": 382.6666666666667,
        "y": 610.4444580078125,
        "width": 295,
        "height": 20,
        "value": "per ....",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728126387412,
        "type": "TextField",
        "x": 268,
        "y": 610.6666666666666,
        "width": 142,
        "height": 20,
        "value": "6 My Spouse/partner earn (give amount) $",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728126810706,
        "type": "TextField",
        "x": 441.3333333333333,
        "y": 46.6666514078776,
        "width": 215,
        "height": 20,
        "value": "Court File number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1728128174678,
        "type": "TextField",
        "x": 189.33333333333334,
        "y": 112.66666666666667,
        "width": 595,
        "height": 20,
        "value": "The valuation date is (give date)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1728128176197,
        "type": "TextField",
        "x": 198,
        "y": 94,
        "width": 582,
        "height": 20,
        "value": "The date of marraige is: (give date)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1728128196574,
        "type": "TextField",
        "x": 449.3333333333333,
        "y": 130.66666666666666,
        "width": 205,
        "height": 20,
        "value": "The date of commencement of cohabitation is (if different from date of marriage): (give date)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1728128315662,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 36.666666666666664,
        "y": 248,
        "width": 822,
        "height": 189,
        "data": [
          [
            "Nature & Type of Ownership",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 1728128346189,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 38.666666666666664,
        "y": 423.3333333333333,
        "width": 819,
        "height": 425,
        "data": [
          [
            "General Household items and Vehicles",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 1728128996952,
        "type": "TextField",
        "x": 444,
        "y": 45.99998474121094,
        "width": 211,
        "height": 20,
        "value": "Court file number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 1728129015981,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 35.333333333333336,
        "y": 118.66668701171875,
        "width": 819,
        "height": 256,
        "data": [
          [
            "Bank Accounts, savings, securities and pensions",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 1728129040092,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 36,
        "y": 318.66668701171875,
        "width": 825,
        "height": 248,
        "data": [
          [
            "Life and disability insurance",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 1728129075644,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 36.666666666666664,
        "y": 540.6666666666666,
        "width": 825,
        "height": 250,
        "data": [
          [
            "Business Interest",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 1728129122052,
        "type": "TextField",
        "x": 443.3333333333333,
        "y": 45.33331807454427,
        "width": 212,
        "height": 20,
        "value": "Court file number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 1728129139064,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 36,
        "y": 110.66665140787761,
        "width": 824,
        "height": 216,
        "data": [
          [
            "Money owed to you",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 1728129162437,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 36,
        "y": 303.3333485921224,
        "width": 824,
        "height": 263,
        "data": [
          [
            "Other Property",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 1728129183828,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 36,
        "y": 566.6666666666666,
        "width": 824,
        "height": 198,
        "data": [
          [
            "Debts and other liabilities",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 1728129217080,
        "type": "TextField",
        "x": 443.3333333333333,
        "y": 46.666666666666664,
        "width": 212,
        "height": 20,
        "value": "Court file number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728129239448,
        "type": "TextField",
        "x": 524,
        "y": 306,
        "width": "90",
        "height": 20,
        "value": "Liabilities - Business interests",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728129239768,
        "type": "TextField",
        "x": 522.6666666666666,
        "y": 271.3333333333333,
        "width": "90",
        "height": 20,
        "value": "Liabilities - Life & disability insurance",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728129239990,
        "type": "TextField",
        "x": 450.6666666666667,
        "y": 272,
        "width": "90",
        "height": 20,
        "value": "Assets - Life & disability insurance",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728129240196,
        "type": "TextField",
        "x": 522.6666666666666,
        "y": 238,
        "width": "90",
        "height": 20,
        "value": "Liabilities - General household items & vehicles",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728129240344,
        "type": "TextField",
        "x": 451.3333333333333,
        "y": 238,
        "width": 90,
        "height": 20,
        "value": "Assets - Bank accounts, savings, securities & pensions",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728129240504,
        "type": "TextField",
        "x": 523.3333333333334,
        "y": 206,
        "width": "90",
        "height": 20,
        "value": "Liabilities - General household items & vehicles",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728129240616,
        "type": "TextField",
        "x": 451.3333333333333,
        "y": 204.66666666666666,
        "width": 90,
        "height": 20,
        "value": "Assets - General household items & vehicles",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728129240808,
        "type": "TextField",
        "x": 524,
        "y": 173.33333333333334,
        "width": 90,
        "height": 20,
        "value": "Liabilities - Land",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728129240948,
        "type": "TextField",
        "x": 451.3333333333333,
        "y": 173.33333333333334,
        "width": "90",
        "height": 20,
        "value": "Assets - Land",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728129324951,
        "type": "TextField",
        "x": 451.3333333333333,
        "y": 404.6666666666667,
        "width": "90",
        "height": 20,
        "value": "Assets - Debts and other liabilities",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728129325176,
        "type": "TextField",
        "x": 523.3333333333334,
        "y": 404.6666666666667,
        "width": "90",
        "height": 20,
        "value": "Liabilities - Debts and other liabilities",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728129325336,
        "type": "TextField",
        "x": 524,
        "y": 372,
        "width": "90",
        "height": 20,
        "value": "Liabilities - Other property (Specify)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728129325524,
        "type": "TextField",
        "x": 452,
        "y": 372.6666666666667,
        "width": "90",
        "height": 20,
        "value": "Assets - Other property (Specify)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728129325699,
        "type": "TextField",
        "x": 451.3333333333333,
        "y": 340,
        "width": "90",
        "height": 20,
        "value": "Assets - Money owed to you",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728129326005,
        "type": "TextField",
        "x": 523.3333333333334,
        "y": 339.3333333333333,
        "width": 90,
        "height": 20,
        "value": "Liabilities - Money owed to you",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728129326168,
        "type": "TextField",
        "x": 451.3333333333333,
        "y": 306.6666666666667,
        "width": 90,
        "height": 20,
        "value": "Assets - Business interests",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728129393316,
        "type": "TextField",
        "x": 452,
        "y": 457.3333333333333,
        "width": "90",
        "height": 20,
        "value": "Net value of property owned on date of Marriage",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728129393964,
        "type": "TextField",
        "x": 452,
        "y": 478.6666666666667,
        "width": "90",
        "height": 20,
        "value": "Value of All deductions",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728129394300,
        "type": "TextField",
        "x": 523.3333333333334,
        "y": 428.6666666666667,
        "width": "90",
        "height": 20,
        "value": "Liabilities - Totals",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728129399035,
        "type": "TextField",
        "x": 451.3333333333333,
        "y": 429.55555534362793,
        "width": "90",
        "height": 20,
        "value": "Assets - Totals",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8
      },
      {
        "id": 1728129743047,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 8,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 36,
        "y": 555.3332926432291,
        "width": 824,
        "height": 205,
        "data": [
          [
            "Excluded Property",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 1728129808960,
        "type": "TextField",
        "x": 442,
        "y": 45.99998474121094,
        "width": 210,
        "height": 20,
        "value": "Court file number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 9
      },
      {
        "id": 1728129845443,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 9,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 36.666666666666664,
        "y": 119.99998474121094,
        "width": 821,
        "height": 216,
        "data": [
          [
            "Disposed-of property",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 1728129864591,
        "type": "TextField",
        "x": 414.6666666666667,
        "y": 358.6666666666667,
        "width": "115",
        "height": 20,
        "value": "Deductions -  subtract total value of excluded property",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 9
      },
      {
        "id": 1728129865015,
        "type": "TextField",
        "x": 414.6666666666667,
        "y": 340.6666666666667,
        "width": 115,
        "height": 20,
        "value": "Deductions - Subtract value of all deductions",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 9
      },
      {
        "id": 1728129865411,
        "type": "TextField",
        "x": 504.6666666666667,
        "y": 358.2222188313802,
        "width": "115",
        "height": 20,
        "value": "Balance - subtract total value of excluded property",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 9
      },
      {
        "id": 1728129865779,
        "type": "TextField",
        "x": 504.6666666666667,
        "y": 340.6666666666667,
        "width": "115",
        "height": 20,
        "value": "Balance - Subtract value of all deductions",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 9
      },
      {
        "id": 1728129865992,
        "type": "TextField",
        "x": 504.6666666666667,
        "y": 322.6666768391927,
        "width": "115",
        "height": 20,
        "value": "Balance - Value of all property owned on valuation date",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 9
      },
      {
        "id": 1728129947463,
        "type": "TextField",
        "x": 505.3333333333333,
        "y": 376,
        "width": "115",
        "height": 20,
        "value": "Balance - net family property",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 9
      },
      {
        "id": 1728130062967,
        "type": "TextField",
        "x": 55.333333333333336,
        "y": 628.6666463216146,
        "width": 175,
        "height": 20,
        "value": "date",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 9
      },
      {
        "id": 1728130063919,
        "type": "TextField",
        "x": 51.333333333333336,
        "y": 598.6666463216146,
        "width": 499,
        "height": 20,
        "value": "province, state or country",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 9
      },
      {
        "id": 1728130064230,
        "type": "TextField",
        "x": 170,
        "y": 569.5555623372396,
        "width": 322,
        "height": 20,
        "value": "Municipality",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 9
      },
      {
        "id": 1728130145686,
        "type": "TextField",
        "x": 480,
        "y": 221.33333333333334,
        "width": "157",
        "height": 20,
        "value": "Subtotal",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 10
      },
      {
        "id": 1728130145947,
        "type": "TextField",
        "x": 480.6666666666667,
        "y": 190,
        "width": "157",
        "height": 20,
        "value": "7 Any other income (specify source)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 10
      },
      {
        "id": 1728130146235,
        "type": "TextField",
        "x": 480.6666666666667,
        "y": 170,
        "width": "157",
        "height": 20,
        "value": "6 Income from a Registered Retirement Income Fund or Annuity",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 10
      },
      {
        "id": 1728130146571,
        "type": "TextField",
        "x": 480,
        "y": 150.66666666666666,
        "width": "157",
        "height": 20,
        "value": "5 Registered retirement savings plan withdrawals",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 10
      },
      {
        "id": 1728130146834,
        "type": "TextField",
        "x": 480.6666666666667,
        "y": 131.33333333333334,
        "width": "157",
        "height": 20,
        "value": "4 Total capital gains ($   ) less capital losses ($   )",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 10
      },
      {
        "id": 1728130147043,
        "type": "TextField",
        "x": 480.6666666666667,
        "y": 110.66666666666667,
        "width": "157",
        "height": 20,
        "value": "3 Total amount of dividends received from taxable Canadian corporations",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 10
      },
      {
        "id": 1728130147243,
        "type": "TextField",
        "x": 480.6666666666667,
        "y": 90.66666666666667,
        "width": "157",
        "height": 20,
        "value": "2 Net rental income (Gross annual rental income of $ )",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 10
      },
      {
        "id": 1728130147495,
        "type": "TextField",
        "x": 480,
        "y": 71.33333333333333,
        "width": "157",
        "height": 20,
        "value": "1 Net partnership income",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 10
      },
      {
        "id": 1728130390282,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 10,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 36,
        "y": 257.3333460489909,
        "width": 824,
        "height": 426,
        "data": [
          [
            "Special or Extraordinary Expenses for the Child(ren)",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 1728130428783,
        "type": "TextField",
        "x": 105.33333333333333,
        "y": 572.8888854980469,
        "width": 150,
        "height": 20,
        "value": "I earn $ ..... per year",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 10
      },
      {
        "id": 188,
        "type": "CheckBox",
        "x": 42.666666666666664,
        "y": 576,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 10
      }
    ]
  }

  if (formType === 'Form13A') {
    staticFields = [
      {
        "id": 1728130611222,
        "type": "TextField",
        "x": 444.6666666666667,
        "y": 59.333333333333336,
        "width": 212,
        "height": 20,
        "value": "Court File Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728130722666,
        "type": "TextField",
        "x": 54.666666666666664,
        "y": 59.333333333333336,
        "width": 550,
        "height": 20,
        "value": "Name of court",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728130735918,
        "type": "TextField",
        "x": 54.666666666666664,
        "y": 88,
        "width": 547,
        "height": 20,
        "value": "Court office address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728130756942,
        "type": "TextField",
        "x": 106.66666666666667,
        "y": 149.33331807454428,
        "width": 295,
        "height": 20,
        "value": "Applicant(s) - Full legal name",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728130757194,
        "type": "TextField",
        "x": 352,
        "y": 194.6666717529297,
        "width": 354,
        "height": 20,
        "value": "Applicant(s) Lawyer -  Email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728130757366,
        "type": "TextField",
        "x": 378,
        "y": 180.00000508626303,
        "width": 314,
        "height": 20,
        "value": "Applicant(s) Lawyer - Phone & fax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728130757550,
        "type": "TextField",
        "x": 364,
        "y": 164.6666514078776,
        "width": 335,
        "height": 20,
        "value": "Applicant(s) Lawyer -  Address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728130757718,
        "type": "TextField",
        "x": 393.3333333333333,
        "y": 149.99998474121094,
        "width": 291,
        "height": 20,
        "value": "Applicant(s) Lawyer - Full legal name",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728130798022,
        "type": "TextField",
        "x": 68.66666666666667,
        "y": 194.00000508626303,
        "width": 351,
        "height": 20,
        "value": "Applicant(s) - Email ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728130798226,
        "type": "TextField",
        "x": 94,
        "y": 180.00000508626303,
        "width": 314,
        "height": 20,
        "value": "Applicant(s) - Phone & Fax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728130798378,
        "type": "TextField",
        "x": 352.6666666666667,
        "y": 282.6666717529297,
        "width": 353,
        "height": 20,
        "value": "Respondent(s) Lawyer - Email ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728130798550,
        "type": "TextField",
        "x": 378.6666666666667,
        "y": 268.000005086263,
        "width": 313,
        "height": 20,
        "value": "Respondent(s) Lawyer - Phone & fax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728130798670,
        "type": "TextField",
        "x": 78.66666666666667,
        "y": 165.33333841959634,
        "width": 337,
        "height": 21,
        "value": "Applicant(s) - address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728130798826,
        "type": "TextField",
        "x": 362.6666666666667,
        "y": 252.6666717529297,
        "width": 337,
        "height": 20,
        "value": "Respondent(s) Lawyer - Address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728130798993,
        "type": "TextField",
        "x": 391.3333333333333,
        "y": 238.00000508626303,
        "width": 294,
        "height": 20,
        "value": "Respondent(s) Lawyer - Full legal name",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 16,
        "type": "CheckBox",
        "x": 41.333333333333336,
        "y": 320,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 17,
        "type": "CheckBox",
        "x": 140.66666666666666,
        "y": 320.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1728130905934,
        "type": "TextField",
        "x": 107.33333333333333,
        "y": 238.00000699361166,
        "width": 294,
        "height": 20,
        "value": "Respondent(s) - Full legal name",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728130906129,
        "type": "TextField",
        "x": 78,
        "y": 252.66667366027832,
        "width": 338,
        "height": 20,
        "value": "Respondent(s) - Address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728130906285,
        "type": "TextField",
        "x": 94.66666666666667,
        "y": 267.333340326945,
        "width": 314,
        "height": 20,
        "value": "Respondent(s) - Phone & Fax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728130906593,
        "type": "TextField",
        "x": 69.33333333333333,
        "y": 282.00000699361163,
        "width": 352,
        "height": 20,
        "value": "Respondent(s) - Email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728131132993,
        "type": "TextField",
        "x": 440,
        "y": 48,
        "width": 217,
        "height": 20,
        "value": "Court file number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728131148401,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 35.333333333333336,
        "y": 74,
        "width": 826,
        "height": 956,
        "data": [
          [
            "Certificate of Financial Disclosure",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 1728131185817,
        "type": "TextField",
        "x": 442,
        "y": 47.333333333333336,
        "width": 214,
        "height": 20,
        "value": "Court file number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728131200378,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 35.333333333333336,
        "y": 74.66666666666667,
        "width": 828,
        "height": 938,
        "data": [
          [
            "Certificate of Financial Disclosure",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 1728131241725,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 34,
        "y": 72.66666666666667,
        "width": 830,
        "height": 951,
        "data": [
          [
            "Certificate of Financial Disclosure",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 1728131329153,
        "type": "TextField",
        "x": 440.6666666666667,
        "y": 46.666666666666664,
        "width": 214,
        "height": 20,
        "value": "Court file number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1728131342557,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 36,
        "y": 78,
        "width": 828,
        "height": 969,
        "data": [
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 1728131366658,
        "type": "TextField",
        "x": 440.6666666666667,
        "y": 46.666666666666664,
        "width": 215,
        "height": 20,
        "value": "Court file number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 1728131382101,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 34.666666666666664,
        "y": 76.66666666666667,
        "width": 828,
        "height": 951,
        "data": [
          [
            "Certificate of Financial Disclosure",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 1728131415673,
        "type": "TextField",
        "x": 440.6666666666667,
        "y": 46.666666666666664,
        "width": 216,
        "height": 20,
        "value": "Court file number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 1728131428469,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 34.666666666666664,
        "y": 79.33333333333333,
        "width": 827,
        "height": 806,
        "data": [
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 1728131445645,
        "type": "TextField",
        "x": 92.66666666666667,
        "y": 661.3333333333334,
        "width": 310,
        "height": 20,
        "value": "City",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 1728131461356,
        "type": "TextField",
        "x": 334,
        "y": 660.6666666666666,
        "width": 150,
        "height": 20,
        "value": "Date",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 1728131480901,
        "type": "TextField",
        "x": 440.6666666666667,
        "y": 47.33331807454427,
        "width": 216,
        "height": 20,
        "value": "Court file number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      }
    ]
  }

  if (formType === 'Form15') {
    staticFields = [
      {
        "id": 1728032049180,
        "type": "TextField",
        "x": 141.33333333333334,
        "y": 55.333333333333336,
        "width": 424,
        "height": 22,
        "value": "court_info.courtName",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtName"
      },
      {
        "id": 1728032135318,
        "type": "TextField",
        "x": 142,
        "y": 92,
        "width": 426,
        "height": 22,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032256161,
        "type": "TextField",
        "x": 435.3333333333333,
        "y": 55.333333333333336,
        "width": 219,
        "height": 20,
        "value": "court_info.courtFileNumber",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "bind": "court_info.courtFileNumber"
      },
      {
        "id": 1728032363329,
        "type": "TextField",
        "x": 118.66666666666667,
        "y": 144.66666666666666,
        "width": 289,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032399755,
        "type": "TextField",
        "x": 118.66666666666667,
        "y": 158.66666666666666,
        "width": 289,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032433643,
        "type": "TextField",
        "x": 118.66666666666667,
        "y": 174,
        "width": 288,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032481261,
        "type": "TextField",
        "x": 118.66666666666667,
        "y": 188.66666666666666,
        "width": 288,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032545779,
        "type": "TextField",
        "x": 384.6666666666667,
        "y": 145.33333333333334,
        "width": 299,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032577303,
        "type": "TextField",
        "x": 384.6666666666667,
        "y": 159.33333333333334,
        "width": 299,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032607511,
        "type": "TextField",
        "x": 384.6666666666667,
        "y": 174,
        "width": 299,
        "height": 21,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032826833,
        "type": "TextField",
        "x": 384.6666666666667,
        "y": 188.66666666666666,
        "width": 298,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033030722,
        "type": "TextField",
        "x": 117.33333333333333,
        "y": 232.66666666666666,
        "width": 292,
        "height": 19,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033085114,
        "type": "TextField",
        "x": 117.33333333333333,
        "y": 247.3333536783854,
        "width": 291,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033354396,
        "type": "TextField",
        "x": 117.33333333333333,
        "y": 261.33335367838544,
        "width": 290,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033454535,
        "type": "TextField",
        "x": 117.33333333333333,
        "y": 276.00002034505206,
        "width": 290,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033499354,
        "type": "TextField",
        "x": 384,
        "y": 233.33333333333334,
        "width": 301,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033524895,
        "type": "TextField",
        "x": 384,
        "y": 248.0000203450521,
        "width": 300,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033572327,
        "type": "TextField",
        "x": 384.6666666666667,
        "y": 262.00002034505206,
        "width": 299,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033609461,
        "type": "TextField",
        "x": 384.6666666666667,
        "y": 276.00000254313153,
        "width": 299,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033669683,
        "type": "TextField",
        "x": 118,
        "y": 321.3333562215169,
        "width": 290,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033750247,
        "type": "TextField",
        "x": 118,
        "y": 335.3333562215169,
        "width": 291,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033796544,
        "type": "TextField",
        "x": 118,
        "y": 349.9999821980794,
        "width": 289,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033850987,
        "type": "TextField",
        "x": 118,
        "y": 364.6666895548503,
        "width": 290,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728034003125,
        "type": "TextField",
        "x": 384.6666666666667,
        "y": 320.8000081380208,
        "width": 299,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728034036332,
        "type": "TextField",
        "x": 384.6666666666667,
        "y": 335.3333282470703,
        "width": 299,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728034063032,
        "type": "TextField",
        "x": 384.6666666666667,
        "y": 349.999994913737,
        "width": 298,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728034110310,
        "type": "TextField",
        "x": 384.6666666666667,
        "y": 364.6666615804036,
        "width": 298,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728034147705,
        "type": "TextField",
        "x": 216.66666666666666,
        "y": 397.3333485921224,
        "width": 553,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728034196309,
        "type": "TextField",
        "x": 164.66666666666666,
        "y": 414.66668192545575,
        "width": 411,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 30,
        "type": "CheckBox",
        "x": 49.333333333333336,
        "y": 435.3333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1728034313215,
        "type": "TextField",
        "x": 189.33333333333334,
        "y": 432.66663614908856,
        "width": 375,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728034431697,
        "type": "TextField",
        "x": 476.6666666666667,
        "y": 434.0000228881836,
        "width": 150,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 33,
        "type": "CheckBox",
        "x": 49.333333333333336,
        "y": 450.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1728034503981,
        "type": "TextField",
        "x": 141.33333333333334,
        "y": 451.3333435058594,
        "width": 447,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728034525083,
        "type": "TextField",
        "x": 476,
        "y": 450.6666666666667,
        "width": 150,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 36,
        "type": "CheckBox",
        "x": 49.333333333333336,
        "y": 468.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1728034613176,
        "type": "TextField",
        "x": 397.3333333333333,
        "y": 469.3333435058594,
        "width": 268,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728034732622,
        "type": "TextField",
        "x": 208.66666666666666,
        "y": 491.8666585286458,
        "width": 231,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728034787275,
        "type": "TextField",
        "x": 386.6666666666667,
        "y": 491.86668904622394,
        "width": 115,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 40,
        "type": "CheckBox",
        "x": 49.333333333333336,
        "y": 493.3333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 41,
        "type": "CheckBox",
        "x": 469.3333333333333,
        "y": 494,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 42,
        "type": "CheckBox",
        "x": 520,
        "y": 494,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 43,
        "type": "CheckBox",
        "x": 48.666666666666664,
        "y": 573.3333333333334,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1728035021625,
        "type": "TextField",
        "x": 47.333333333333336,
        "y": 687.3333536783854,
        "width": 378,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728035518048,
        "type": "TextField",
        "x": 442,
        "y": 45.33331807454427,
        "width": 215,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728035657234,
        "type": "TextField",
        "x": 359.3333333333333,
        "y": 101.99999491373698,
        "width": 344,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728035754288,
        "type": "TextField",
        "x": 358,
        "y": 121.99999491373698,
        "width": 345,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728035811552,
        "type": "TextField",
        "x": 358.6666666666667,
        "y": 142.6666717529297,
        "width": 345,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728035894119,
        "type": "TextField",
        "x": 358.6666666666667,
        "y": 163.33333841959634,
        "width": 346,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728036057552,
        "type": "TextField",
        "x": 252.66666666666666,
        "y": 184.66665395100912,
        "width": 504,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728036103062,
        "type": "TextField",
        "x": 252.66666666666666,
        "y": 204.66665395100912,
        "width": 504,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728036148925,
        "type": "TextField",
        "x": 252.66666666666666,
        "y": 226.00000762939453,
        "width": 504,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728036299906,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 55.333333333333336,
        "y": 328.00001017252606,
        "width": 797,
        "height": 107,
        "data": [
          [
            "8. Information about the child (ren)",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ],
        "value": ""
      },
      {
        "id": 1728036365039,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 53.333333333333336,
        "y": 493.86669921875,
        "width": 802,
        "height": 200,
        "data": [
          [
            "9. If you are asking to change support,...",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ],
        "value": ""
      },
      {
        "id": 55,
        "type": "CheckBox",
        "x": 80.66666666666667,
        "y": 628.6666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 56,
        "type": "CheckBox",
        "x": 80.66666666666667,
        "y": 646.6666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 57,
        "type": "CheckBox",
        "x": 326.6666666666667,
        "y": 628.6666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 58,
        "type": "CheckBox",
        "x": 326.6666666666667,
        "y": 646,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 59,
        "type": "CheckBox",
        "x": 326.6666666666667,
        "y": 662.6666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1728036666956,
        "type": "TextField",
        "x": 187.33333333333334,
        "y": 121.33332824707031,
        "width": 600,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728036708539,
        "type": "TextField",
        "x": 187.33333333333334,
        "y": 150.6666692097982,
        "width": 601,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728036758996,
        "type": "TextField",
        "x": 186.66666666666666,
        "y": 180.0000025431315,
        "width": 602,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728036800822,
        "type": "TextField",
        "x": 186.66666666666666,
        "y": 210.6666692097982,
        "width": 602,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728036828803,
        "type": "TextField",
        "x": 186.66666666666666,
        "y": 240.0000025431315,
        "width": 602,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728036855409,
        "type": "TextField",
        "x": 187.33333333333334,
        "y": 269.33333587646484,
        "width": 603,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728036884114,
        "type": "TextField",
        "x": 186.66666666666666,
        "y": 299.33333587646484,
        "width": 605,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728036908589,
        "type": "TextField",
        "x": 187.33333333333334,
        "y": 328.6666895548503,
        "width": 605,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728036960110,
        "type": "TextField",
        "x": 186.66666666666666,
        "y": 359.3333384195964,
        "width": 606,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728036982246,
        "type": "TextField",
        "x": 186,
        "y": 387.99998474121094,
        "width": 606,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728037022253,
        "type": "TextField",
        "x": 186,
        "y": 418.66669209798175,
        "width": 606,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728037068163,
        "type": "TextField",
        "x": 186.66666666666666,
        "y": 448.00001017252606,
        "width": 606,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728037098915,
        "type": "TextField",
        "x": 186,
        "y": 478.66664632161456,
        "width": 607,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728037131298,
        "type": "TextField",
        "x": 186.66666666666666,
        "y": 508.00002034505206,
        "width": 606,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728037180414,
        "type": "TextField",
        "x": 445.3333333333333,
        "y": 45.333333333333336,
        "width": 209,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728037245310,
        "type": "TextField",
        "x": 444,
        "y": 48.666666666666664,
        "width": 210,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728037277869,
        "type": "TextField",
        "x": 50.666666666666664,
        "y": 320.6666717529297,
        "width": 378,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728037330116,
        "type": "TextField",
        "x": 116,
        "y": 400.6666768391927,
        "width": 708,
        "height": 22,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728037478871,
        "type": "TextField",
        "x": 52.666666666666664,
        "y": 474.80005900065106,
        "width": 383,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728037549915,
        "type": "TextField",
        "x": 450.6666666666667,
        "y": 46.666666666666664,
        "width": 202,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 80,
        "type": "CheckBox",
        "x": 74.66666666666667,
        "y": 172.66666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 5
      },
      {
        "id": 81,
        "type": "CheckBox",
        "x": 188,
        "y": 173.33333333333334,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 5
      },
      {
        "id": 1728037663206,
        "type": "TextArea",
        "x": 51.333333333333336,
        "y": 192.66666666666666,
        "width": 803,
        "height": 133,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1728037784162,
        "type": "TextArea",
        "x": 51.333333333333336,
        "y": 320.66665903727215,
        "width": 803,
        "height": 610,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1728038289671,
        "type": "TextField",
        "x": 444.6666666666667,
        "y": 46.6666514078776,
        "width": 210,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 85,
        "type": "CheckBox",
        "x": 333.3333333333333,
        "y": 130.66666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 86,
        "type": "CheckBox",
        "x": 482,
        "y": 130.66666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 1728038491192,
        "type": "TextField",
        "x": 80.66666666666667,
        "y": 202.66666666666666,
        "width": 176,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 1728038521361,
        "type": "TextField",
        "x": 210,
        "y": 202.66666666666666,
        "width": 174,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 1728038617810,
        "type": "TextField",
        "x": 338.6666666666667,
        "y": 202.66666666666666,
        "width": 176,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 1728038750486,
        "type": "TextField",
        "x": 466.6666666666667,
        "y": 202.6666717529297,
        "width": 179,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 91,
        "type": "CheckBox",
        "x": 74.66666666666667,
        "y": 244.66666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 92,
        "type": "CheckBox",
        "x": 75.33333333333333,
        "y": 264.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 1728038818541,
        "type": "TextField",
        "x": 262,
        "y": 262.6666717529297,
        "width": 488,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 1728038897767,
        "type": "TextField",
        "x": 92,
        "y": 322.6666717529297,
        "width": 745,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 95,
        "type": "CheckBox",
        "x": 106,
        "y": 364.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 96,
        "type": "CheckBox",
        "x": 218.66666666666666,
        "y": 365.3333333333333,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 6
      },
      {
        "id": 1728039058061,
        "type": "TextArea",
        "x": 92,
        "y": 383.3333435058594,
        "width": 741,
        "height": 218,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 1728039193298,
        "type": "TextArea",
        "x": 92.66666666666667,
        "y": 554.6666870117188,
        "width": 739,
        "height": 217,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 1728039632011,
        "type": "TextField",
        "x": 444.6666666666667,
        "y": 46.666666666666664,
        "width": 211,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 1728039664503,
        "type": "TextArea",
        "x": 93.33333333333333,
        "y": 95.33333841959636,
        "width": 737,
        "height": 701,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 1728039755376,
        "type": "TextField",
        "x": 192.66666666666666,
        "y": 592.8000895182291,
        "width": 276,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 1728039824091,
        "type": "TextField",
        "x": 66.66666666666667,
        "y": 621.2000325520834,
        "width": 466,
        "height": 21,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 1728039968988,
        "type": "TextField",
        "x": 70,
        "y": 650.6666870117188,
        "width": 182,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 7
      },
      {
        "id": 104,
        "type": "CheckBox",
        "x": 48.666666666666664,
        "y": 218.66666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 8
      },
      {
        "id": 105,
        "type": "CheckBox",
        "x": 49.333333333333336,
        "y": 239.33333333333334,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 8
      },
      {
        "id": 106,
        "type": "CheckBox",
        "x": 28.666666666666668,
        "y": 266,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 8
      },
      {
        "id": 107,
        "type": "CheckBox",
        "x": 28.666666666666668,
        "y": 282.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 8
      },
      {
        "id": 108,
        "type": "CheckBox",
        "x": 28.666666666666668,
        "y": 312,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 8
      },
      {
        "id": 109,
        "type": "CheckBox",
        "x": 49.333333333333336,
        "y": 326.6666666666667,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 8
      },
      {
        "id": 110,
        "type": "CheckBox",
        "x": 48.666666666666664,
        "y": 354.000005086263,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 8
      },
      {
        "id": 111,
        "type": "CheckBox",
        "x": 49.333333333333336,
        "y": 402.6666768391927,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 8
      },
      {
        "id": 112,
        "type": "CheckBox",
        "x": 28,
        "y": 463.3333435058594,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 8
      },
      {
        "id": 113,
        "type": "CheckBox",
        "x": 28,
        "y": 501.86667887369794,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 8
      },
      {
        "id": 114,
        "type": "CheckBox",
        "x": 28.666666666666668,
        "y": 605.2000122070312,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 8
      },
      {
        "id": 115,
        "type": "CheckBox",
        "x": 49.333333333333336,
        "y": 622.933349609375,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 8
      },
      {
        "id": 116,
        "type": "CheckBox",
        "x": 49.333333333333336,
        "y": 638.5333455403646,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 8
      },
      {
        "id": 117,
        "type": "CheckBox",
        "x": 48.666666666666664,
        "y": 665.8666941324869,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 8
      },
      {
        "id": 118,
        "type": "CheckBox",
        "x": 28.666666666666668,
        "y": 692.6666666666666,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 8
      },
      {
        "id": 119,
        "type": "CheckBox",
        "x": 28.666666666666668,
        "y": 709.3333231608073,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 8
      },
      {
        "id": 120,
        "type": "CheckBox",
        "x": 28.666666666666668,
        "y": 709.2000274658203,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 8
      },
      {
        "id": 121,
        "type": "CheckBox",
        "x": 28.666666666666668,
        "y": 725.8666941324869,
        "width": 20,
        "height": 20,
        "value": "",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 8
      }
    ]
  }

  if (formType === 'Form15B') {
    staticFields = [
      {
        "id": 1728032035038,
        "type": "TextField",
        "x": 428,
        "y": 40,
        "width": 218,
        "height": 22,
        "value": "Court File Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 2,
        "type": "CheckBox",
        "x": 327.3333333333333,
        "y": 126,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 5
      },
      {
        "id": 3,
        "type": "CheckBox",
        "x": 476,
        "y": 126,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 5
      },
      {
        "id": 1728032125002,
        "type": "TextField",
        "x": 75.33333333333333,
        "y": 197.33333841959634,
        "width": 175,
        "height": 20,
        "value": "Child support owed to recipient $",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1728032147362,
        "type": "TextField",
        "x": 203.33333333333334,
        "y": 198.00000508626303,
        "width": 178,
        "height": 20,
        "value": "Child support owed to any assignee(s) $",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1728032179049,
        "type": "TextField",
        "x": 332.6666666666667,
        "y": 198.6666717529297,
        "width": 176,
        "height": 20,
        "value": "Spousal support owed to recipient $",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1728032220049,
        "type": "TextField",
        "x": 460.6666666666667,
        "y": 198.6666717529297,
        "width": 170,
        "height": 20,
        "value": "Spousal support owed to any assignee(s) $",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 8,
        "type": "CheckBox",
        "x": 69.33333333333333,
        "y": 241.33333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 5
      },
      {
        "id": 9,
        "type": "CheckBox",
        "x": 69.33333333333333,
        "y": 263.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 5
      },
      {
        "id": 10,
        "type": "CheckBox",
        "x": 100,
        "y": 364,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 5
      },
      {
        "id": 11,
        "type": "CheckBox",
        "x": 214,
        "y": 364,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 5
      },
      {
        "id": 1728032362165,
        "type": "TextField",
        "x": 256,
        "y": 260.00000699361163,
        "width": 477,
        "height": 20,
        "value": "(given exact date: d, m, y)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1728032389086,
        "type": "TextField",
        "x": 86,
        "y": 319.3333435058594,
        "width": 734,
        "height": 20,
        "value": "Question 17 a What date did you first ask the other party for updated income information or to change support?",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1728032460132,
        "type": "TextArea",
        "x": 66,
        "y": 382.6666666666667,
        "width": 763,
        "height": 215,
        "value": "Question 17 (b)\n\nYes. (Give details in the box below)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1728032496053,
        "type": "TextArea",
        "x": 66.66666666666667,
        "y": 554.0000203450521,
        "width": 763,
        "height": 215,
        "value": "Question 17 (c)\n\nWhy didn't you ask the court to change support sooner?",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1728032552629,
        "type": "TextField",
        "x": 421.3333333333333,
        "y": 48.666666666666664,
        "width": 234,
        "height": 20,
        "value": "Court File Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032573713,
        "type": "TextField",
        "x": 142.66666666666666,
        "y": 50,
        "width": 340,
        "height": 20,
        "value": "Name of court",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032588361,
        "type": "TextField",
        "x": 65.33333333333333,
        "y": 78,
        "width": 522,
        "height": 20,
        "value": "Court office address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032644105,
        "type": "TextField",
        "x": 116.66666666666667,
        "y": 130.6666514078776,
        "width": 287,
        "height": 20,
        "value": "Applicant(s) Full Legal name",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032673737,
        "type": "TextField",
        "x": 116.66666666666667,
        "y": 145.33331807454428,
        "width": 286,
        "height": 20,
        "value": "Applicant(s) Address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032723193,
        "type": "TextField",
        "x": 116.66666666666667,
        "y": 160.6666514078776,
        "width": 287,
        "height": 20,
        "value": "Applicant(s) Phone & fax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032735196,
        "type": "TextField",
        "x": 116.66666666666667,
        "y": 176.00000508626303,
        "width": 288,
        "height": 20,
        "value": "Applicant(s) Email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032771640,
        "type": "TextField",
        "x": 381.3333333333333,
        "y": 131.33331807454428,
        "width": 293,
        "height": 20,
        "value": "Applicant(s) Lawyer Name",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032779437,
        "type": "TextField",
        "x": 381.3333333333333,
        "y": 145.99998474121094,
        "width": 293,
        "height": 20,
        "value": "Applicant(s) Lawyer Address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032789653,
        "type": "TextField",
        "x": 382,
        "y": 160.6666514078776,
        "width": 292,
        "height": 20,
        "value": "Applicant(s) Lawyer Phone & fax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032800245,
        "type": "TextField",
        "x": 382,
        "y": 175.33333841959634,
        "width": 292,
        "height": 21,
        "value": "Applicant(s) Lawyer Email ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032849789,
        "type": "TextField",
        "x": 116,
        "y": 213.99998664855957,
        "width": 290,
        "height": 20,
        "value": "Respondent(s) Full Legal name",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032861593,
        "type": "TextField",
        "x": 116.66666666666667,
        "y": 229.33334032694498,
        "width": 290,
        "height": 20,
        "value": "Respondent(s) Address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032870881,
        "type": "TextField",
        "x": 116.66666666666667,
        "y": 244.00000699361166,
        "width": 290,
        "height": 20,
        "value": "Respondent(s) Phone & fax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032881741,
        "type": "TextField",
        "x": 116.66666666666667,
        "y": 258.6666736602783,
        "width": 291,
        "height": 20,
        "value": "Respondent(s) Email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032954361,
        "type": "TextField",
        "x": 380.6666666666667,
        "y": 214.00000699361166,
        "width": 294,
        "height": 20,
        "value": "Respondent(s) Name",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032965441,
        "type": "TextField",
        "x": 381.3333333333333,
        "y": 229.33334032694498,
        "width": 293,
        "height": 20,
        "value": "Respondent(s) Address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032985413,
        "type": "TextField",
        "x": 382,
        "y": 244.00000699361166,
        "width": 293,
        "height": 20,
        "value": "Respondent(s) Phone & fax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728032995525,
        "type": "TextField",
        "x": 382,
        "y": 258.6666736602783,
        "width": 293,
        "height": 20,
        "value": "Respondent(s) Email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033071320,
        "type": "TextField",
        "x": 116.66666666666667,
        "y": 297.3333435058594,
        "width": 291,
        "height": 20,
        "value": "Assignee of Support Order (if applicable) Full legal name",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033078801,
        "type": "TextField",
        "x": 116.66666666666667,
        "y": 312.6666768391927,
        "width": 292,
        "height": 20,
        "value": "Assignee of Support Order (if applicable) Address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033087032,
        "type": "TextField",
        "x": 116.66666666666667,
        "y": 328.00001017252606,
        "width": 291,
        "height": 20,
        "value": "Assignee of Support Order (if applicable) Phone & fax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033100097,
        "type": "TextField",
        "x": 116.66666666666667,
        "y": 342.6666768391927,
        "width": 292,
        "height": 20,
        "value": "Assignee of Support Order (if applicable) Email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033471780,
        "type": "TextField",
        "x": 381.3333333333333,
        "y": 297.3333435058594,
        "width": 295,
        "height": 20,
        "value": "Assignee's Lawyer Name",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033490508,
        "type": "TextField",
        "x": 381.3333333333333,
        "y": 312.6666768391927,
        "width": 295,
        "height": 20,
        "value": "Assignee's Lawyer Address ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033501008,
        "type": "TextField",
        "x": 381.3333333333333,
        "y": 327.3333435058594,
        "width": 294,
        "height": 21,
        "value": "Assignee's Lawyer Phone & fax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033514536,
        "type": "TextField",
        "x": 382,
        "y": 342.6666768391927,
        "width": 294,
        "height": 22,
        "value": "Assignee's Lawyer Email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033590267,
        "type": "TextField",
        "x": 192,
        "y": 386.00001017252606,
        "width": 579,
        "height": 20,
        "value": "My name is (full legal name) ......",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033598195,
        "type": "TextArea",
        "x": 208.66666666666666,
        "y": 421.3333333333333,
        "width": 224,
        "height": 20,
        "value": "I live in (municipality & province",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 45,
        "type": "CheckBox",
        "x": 66,
        "y": 473.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 46,
        "type": "CheckBox",
        "x": 66.66666666666667,
        "y": 520.6666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 47,
        "type": "CheckBox",
        "x": 66.66666666666667,
        "y": 441.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1728033746980,
        "type": "TextField",
        "x": 172,
        "y": 499.33335367838544,
        "width": 29,
        "height": 20,
        "value": "4 a",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033777979,
        "type": "TextField",
        "x": 228.66666666666666,
        "y": 498.6666666666667,
        "width": 30,
        "height": 20,
        "value": "4c",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033782451,
        "type": "TextField",
        "x": 200.66666666666666,
        "y": 499.1111246744792,
        "width": 28,
        "height": 20,
        "value": "4b",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033821408,
        "type": "TextField",
        "x": 343.3333333333333,
        "y": 498.00002034505206,
        "width": 32,
        "height": 20,
        "value": "4g",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033822552,
        "type": "TextField",
        "x": 314.6666666666667,
        "y": 498.66668701171875,
        "width": 31,
        "height": 20,
        "value": "4f",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033830108,
        "type": "TextField",
        "x": 286,
        "y": 499.1111246744792,
        "width": 32,
        "height": 20,
        "value": "4e",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033835296,
        "type": "TextField",
        "x": 256.6666666666667,
        "y": 498.4444580078125,
        "width": 29,
        "height": 20,
        "value": "4d",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033961464,
        "type": "TextField",
        "x": 370,
        "y": 498.4444580078125,
        "width": 34,
        "height": 20,
        "value": "4h",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033962032,
        "type": "TextField",
        "x": 428,
        "y": 499.3333333333333,
        "width": 33,
        "height": 20,
        "value": "4j",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728033962372,
        "type": "TextField",
        "x": 399.3333333333333,
        "y": 499.3333333333333,
        "width": 31,
        "height": 20,
        "value": "4i",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728034042488,
        "type": "TextField",
        "x": 342,
        "y": 546.6666666666666,
        "width": 32,
        "height": 20,
        "value": "5g",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728034044167,
        "type": "TextField",
        "x": 313.3333333333333,
        "y": 546,
        "width": 33,
        "height": 20,
        "value": "5f",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728034044699,
        "type": "TextField",
        "x": 284.6666666666667,
        "y": 546,
        "width": 31,
        "height": 20,
        "value": "5e",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728034045131,
        "type": "TextField",
        "x": 171.33333333333334,
        "y": 546.6666666666666,
        "width": 33,
        "height": 20,
        "value": "5a",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728034045523,
        "type": "TextField",
        "x": 201.33333333333334,
        "y": 546.6666666666666,
        "width": 32,
        "height": 20,
        "value": "5b",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728034062770,
        "type": "TextField",
        "x": 228.66666666666666,
        "y": 546.6666666666666,
        "width": 32,
        "height": 20,
        "value": "5c",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728034063063,
        "type": "TextField",
        "x": 257.3333333333333,
        "y": 546.6666666666666,
        "width": 32,
        "height": 20,
        "value": "5d",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728034239647,
        "type": "TextField",
        "x": 399.3333333333333,
        "y": 546.6666870117188,
        "width": 31,
        "height": 20,
        "value": "5i",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728034239971,
        "type": "TextField",
        "x": 370.6666666666667,
        "y": 546.6666259765625,
        "width": 33,
        "height": 20,
        "value": "5h",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728034248371,
        "type": "TextField",
        "x": 428,
        "y": 546.4444580078125,
        "width": 32,
        "height": 20,
        "value": "5j",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728034322622,
        "type": "TextArea",
        "x": 47.333333333333336,
        "y": 595.5555623372396,
        "width": 796,
        "height": 169,
        "value": "Question 6 \n\nI disagree with the claims made by the requesting party because (briefly explain why you do not think that the current order/agreement should be changed):",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 69,
        "type": "CheckBox",
        "x": 66.66666666666667,
        "y": 64,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1728034461647,
        "type": "TextField",
        "x": 428,
        "y": 39.99998474121094,
        "width": 219,
        "height": 20,
        "value": "Court File Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728034478619,
        "type": "TextArea",
        "x": 42.666666666666664,
        "y": 95.33335367838542,
        "width": 799,
        "height": 520,
        "value": "Question 7 \n\nI also disagree with the following facts in the requesting party's Motion to Change Form (Form 15)( briefly explain what information you do not agree with and explain why):",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 72,
        "type": "CheckBox",
        "x": 90.66666666666667,
        "y": 558,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 73,
        "type": "CheckBox",
        "x": 143.33333333333334,
        "y": 490,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 74,
        "type": "CheckBox",
        "x": 90.66666666666667,
        "y": 540,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 75,
        "type": "CheckBox",
        "x": 66.66666666666667,
        "y": 451.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 76,
        "type": "CheckBox",
        "x": 256.6666666666667,
        "y": 490.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1728034640142,
        "type": "TextField",
        "x": 218,
        "y": 599.111083984375,
        "width": 320,
        "height": 20,
        "value": "9 (c) Child Support Service dated .....",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728034677494,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 42.666666666666664,
        "y": 681.3333333333334,
        "width": 798,
        "height": 58,
        "data": [
          [
            "9 (d) Please give information about ...",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 79,
        "type": "CheckBox",
        "x": 66.66666666666667,
        "y": 134,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 80,
        "type": "CheckBox",
        "x": 314.6666666666667,
        "y": 134.66666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 81,
        "type": "CheckBox",
        "x": 66.66666666666667,
        "y": 152.66666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 82,
        "type": "CheckBox",
        "x": 314.6666666666667,
        "y": 152,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 83,
        "type": "CheckBox",
        "x": 66,
        "y": 169.33333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 84,
        "type": "CheckBox",
        "x": 314.6666666666667,
        "y": 168.66666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 85,
        "type": "CheckBox",
        "x": 314.6666666666667,
        "y": 186.66666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1728034788794,
        "type": "TextField",
        "x": 181.33333333333334,
        "y": 260.00001017252606,
        "width": 594,
        "height": 20,
        "value": "11 a Current term",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728034806507,
        "type": "TextField",
        "x": 182,
        "y": 290.6666768391927,
        "width": 593,
        "height": 20,
        "value": "11 a Request change",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728034826015,
        "type": "TextField",
        "x": 181.33333333333334,
        "y": 441.33331298828125,
        "width": 590,
        "height": 20,
        "value": "11 d Current term",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728034826395,
        "type": "TextField",
        "x": 181.33333333333334,
        "y": 409.99997965494794,
        "width": 591,
        "height": 20,
        "value": "11 c Request change",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728034827235,
        "type": "TextField",
        "x": 181.33333333333334,
        "y": 380.66664632161456,
        "width": 591,
        "height": 20,
        "value": "11 c Current term",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728034827479,
        "type": "TextField",
        "x": 181.33333333333334,
        "y": 349.99997965494794,
        "width": 593,
        "height": 20,
        "value": "11 b Requested change",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728034827590,
        "type": "TextField",
        "x": 181.33333333333334,
        "y": 320.66664632161456,
        "width": 593,
        "height": 20,
        "value": "11 b Current term",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728035642283,
        "type": "TextField",
        "x": 182,
        "y": 470,
        "width": 589,
        "height": 20,
        "value": "11 d Requested change",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728035642786,
        "type": "TextField",
        "x": 182,
        "y": 500,
        "width": 589,
        "height": 20,
        "value": "11 e Current term",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728035643218,
        "type": "TextField",
        "x": 181.33333333333334,
        "y": 560.6666666666666,
        "width": 589,
        "height": 20,
        "value": "11 f Current term",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728035643634,
        "type": "TextField",
        "x": 181.33333333333334,
        "y": 530.8888956705729,
        "width": 590,
        "height": 20,
        "value": "11 e Requested change",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728035644066,
        "type": "TextField",
        "x": 180.66666666666666,
        "y": 650.6666666666666,
        "width": 592,
        "height": 20,
        "value": "11 g Requested change",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728035644474,
        "type": "TextField",
        "x": 181.33333333333334,
        "y": 620,
        "width": 590,
        "height": 20,
        "value": "11 g Current term",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728035645138,
        "type": "TextField",
        "x": 181.33333333333334,
        "y": 590.6666666666666,
        "width": 590,
        "height": 20,
        "value": "11 f Requested change",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728035878865,
        "type": "TextField",
        "x": 428,
        "y": 41.333333333333336,
        "width": 219,
        "height": 20,
        "value": "Court File Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 101,
        "type": "CheckBox",
        "x": 66.66666666666667,
        "y": 152,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 102,
        "type": "CheckBox",
        "x": 181.33333333333334,
        "y": 152.66666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 4
      },
      {
        "id": 1728035927316,
        "type": "TextArea",
        "x": 42.666666666666664,
        "y": 170.66665331522623,
        "width": 798,
        "height": 133,
        "value": "Question 12\n\nNo (Give details in the box below.)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728035971113,
        "type": "TextArea",
        "x": 43.333333333333336,
        "y": 299.3333333333333,
        "width": 797,
        "height": 664,
        "value": "Question 13 \n\nBriefly give the facts that show why the court should change the order/agreement, including how your situation has changed since the order/agreement was made:",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728036041709,
        "type": "TextArea",
        "x": 67.33333333333333,
        "y": 79.99998982747395,
        "width": 761,
        "height": 312,
        "value": "Question 17 d \n\nWhat are your circumstances and the child's circumstances that support this request?",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 1728036047833,
        "type": "TextField",
        "x": 428,
        "y": 39.99998474121094,
        "width": 221,
        "height": 20,
        "value": "Court File Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 1728036130741,
        "type": "TextField",
        "x": 184,
        "y": 491.33335367838544,
        "width": 280,
        "height": 20,
        "value": "municipality",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 1728036150769,
        "type": "TextField",
        "x": 58.666666666666664,
        "y": 521.5555623372396,
        "width": 469,
        "height": 20,
        "value": "province, state or country",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 1728036179917,
        "type": "TextField",
        "x": 66.66666666666667,
        "y": 551.3333333333334,
        "width": 150,
        "height": 20,
        "value": "signature Date",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 1728036243301,
        "type": "TextField",
        "x": 106.66666666666667,
        "y": 643.3333333333334,
        "width": 704,
        "height": 20,
        "value": "Lawyer's certificate My name is: .....",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 1728036339404,
        "type": "TextField",
        "x": 116.66666666666667,
        "y": 702.6666666666666,
        "width": 150,
        "height": 20,
        "value": "signature Date",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 6
      },
      {
        "id": 112,
        "type": "CheckBox",
        "x": 72,
        "y": 418,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 7
      },
      {
        "id": 113,
        "type": "CheckBox",
        "x": 72,
        "y": 381.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 7
      },
      {
        "id": 114,
        "type": "CheckBox",
        "x": 72,
        "y": 360.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 7
      },
      {
        "id": 115,
        "type": "CheckBox",
        "x": 42,
        "y": 336.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 7
      },
      {
        "id": 116,
        "type": "CheckBox",
        "x": 41.333333333333336,
        "y": 478,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 7
      },
      {
        "id": 117,
        "type": "CheckBox",
        "x": 41.333333333333336,
        "y": 500.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 7
      },
      {
        "id": 118,
        "type": "CheckBox",
        "x": 42,
        "y": 452.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 7
      },
      {
        "id": 1728036496928,
        "type": "TextField",
        "x": 427.3333333333333,
        "y": 39.99998474121094,
        "width": 219,
        "height": 20,
        "value": "Court File Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      }
    ]
  }

  if (formType === 'Form15C') {
    staticFields = [
      {
        "id": 1728036744211,
        "type": "TextField",
        "x": 432,
        "y": 49.333333333333336,
        "width": 228,
        "height": 20,
        "value": "Court File Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728036759791,
        "type": "TextField",
        "x": 152.66666666666666,
        "y": 48.666666666666664,
        "width": 294,
        "height": 20,
        "value": "Name of court",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728036773699,
        "type": "TextField",
        "x": 64.66666666666667,
        "y": 78,
        "width": 512,
        "height": 20,
        "value": "Court office address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728036792552,
        "type": "TextField",
        "x": 102,
        "y": 170.00000508626303,
        "width": 313,
        "height": 20,
        "value": "Applicant(s) Email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728036795507,
        "type": "TextField",
        "x": 102,
        "y": 154.6666514078776,
        "width": "313",
        "height": 20,
        "value": "Applicant(s) Phone & fax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728036795915,
        "type": "TextField",
        "x": 102,
        "y": 139.99998474121094,
        "width": "313",
        "height": 20,
        "value": "Applicant(s) Address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728036796140,
        "type": "TextField",
        "x": 102,
        "y": 124.66665140787761,
        "width": 313,
        "height": 20,
        "value": "Applicant(s) Full legal name",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728036869643,
        "type": "TextField",
        "x": 102,
        "y": 208.00000508626303,
        "width": "313",
        "height": 20,
        "value": "Respondent(s) Full legal name",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728036869984,
        "type": "TextField",
        "x": 102,
        "y": 222.6666717529297,
        "width": "313",
        "height": 20,
        "value": "Respondent(s)  Address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728036870328,
        "type": "TextField",
        "x": 102,
        "y": 238.00000508626303,
        "width": "313",
        "height": 20,
        "value": "Respondent(s)  Phone & fax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728036870647,
        "type": "TextField",
        "x": 102,
        "y": 253.33331807454428,
        "width": "313",
        "height": 20,
        "value": "Respondent(s)  Email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728037052572,
        "type": "TextField",
        "x": 382,
        "y": 170.00000508626303,
        "width": 302,
        "height": 20,
        "value": "Applicant(s) Lawyer Email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728037052951,
        "type": "TextField",
        "x": 382,
        "y": 154.6666514078776,
        "width": 302,
        "height": 20,
        "value": "Applicant(s) Lawyer Phone & fax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728037053283,
        "type": "TextField",
        "x": 382,
        "y": 139.99998474121094,
        "width": "302",
        "height": 20,
        "value": "Applicant(s) Lawyer Address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728037053563,
        "type": "TextField",
        "x": 382,
        "y": 124.66665140787761,
        "width": "302",
        "height": 20,
        "value": "Applicant(s) Lawyer Name",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728037148195,
        "type": "TextField",
        "x": 382,
        "y": 253.33334032694498,
        "width": "302",
        "height": 18,
        "value": "Respondent(s) Lawyer Email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728037149379,
        "type": "TextField",
        "x": 382,
        "y": 238.66667366027832,
        "width": "302",
        "height": "18",
        "value": "Respondent(s) Lawyer Phone & fax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728037149767,
        "type": "TextField",
        "x": 382,
        "y": 223.33334032694498,
        "width": 302,
        "height": "18",
        "value": "Respondent(s) Lawyer Address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728037150067,
        "type": "TextField",
        "x": 382,
        "y": 208.00000699361166,
        "width": 302,
        "height": "18",
        "value": "Respondent(s) Lawyer Name",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728037302446,
        "type": "TextField",
        "x": 102,
        "y": 336.6666666666667,
        "width": "313",
        "height": 20,
        "value": "Assignee of Support Order (if applicable) Email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728037302851,
        "type": "TextField",
        "x": 102,
        "y": 322,
        "width": "313",
        "height": 20,
        "value": "Assignee of Support Order (if applicable) Phone & fax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728037303203,
        "type": "TextField",
        "x": 102,
        "y": 307.3333333333333,
        "width": 313,
        "height": 20,
        "value": "Assignee of Support Order (if applicable) Address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728037303395,
        "type": "TextField",
        "x": 102,
        "y": 292,
        "width": "313",
        "height": 20,
        "value": "Assignee of Support Order (if applicable) Full legal name",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728037406710,
        "type": "TextField",
        "x": 382,
        "y": 292,
        "width": "302",
        "height": 20,
        "value": "Assignee's Lawyer Name",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728037446335,
        "type": "TextField",
        "x": 382,
        "y": 307.3333333333333,
        "width": "302",
        "height": 20,
        "value": "Assignee's Lawyer  Address",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728037461176,
        "type": "TextField",
        "x": 382,
        "y": 322.6666666666667,
        "width": "302",
        "height": 20,
        "value": "Assignee's Lawyer  Phone & fax",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728037467499,
        "type": "TextField",
        "x": 382,
        "y": 337.3333333333333,
        "width": "302",
        "height": 20,
        "value": "Assignee's Lawyer Email",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 28,
        "type": "CheckBox",
        "x": 54.666666666666664,
        "y": 513.3333333333334,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 29,
        "type": "CheckBox",
        "x": 54.666666666666664,
        "y": 545.3333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 30,
        "type": "CheckBox",
        "x": 54.666666666666664,
        "y": 530,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 31,
        "type": "CheckBox",
        "x": 76,
        "y": 572.6666666666666,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 32,
        "type": "CheckBox",
        "x": 54.666666666666664,
        "y": 633.3333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 1
      },
      {
        "id": 1728038329070,
        "type": "TextField",
        "x": 252,
        "y": 585.5555826822916,
        "width": 212,
        "height": 20,
        "value": "Child Support Service dated",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728038358497,
        "type": "TextField",
        "x": 296,
        "y": 631.1111145019531,
        "width": 434,
        "height": 20,
        "value": "4 We agree that (Name(s) of person(s) or party(ies))",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1
      },
      {
        "id": 1728038392698,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 1,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 74,
        "y": 680,
        "width": 765,
        "height": 82,
        "data": [
          [
            "Table 4",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 1728038438021,
        "type": "TextField",
        "x": 432,
        "y": 40.666666666666664,
        "width": 230,
        "height": 20,
        "value": "Court File Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 37,
        "type": "CheckBox",
        "x": 54.666666666666664,
        "y": 70.66666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 38,
        "type": "CheckBox",
        "x": 55.333333333333336,
        "y": 141.33333333333334,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 39,
        "type": "CheckBox",
        "x": 55.333333333333336,
        "y": 290,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 40,
        "type": "CheckBox",
        "x": 54.666666666666664,
        "y": 273.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 41,
        "type": "CheckBox",
        "x": 55.333333333333336,
        "y": 256,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1728038525649,
        "type": "TextField",
        "x": 286,
        "y": 68,
        "width": 451,
        "height": 20,
        "value": "We agree that (name(s) of person(s) or party(ies))",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728038533897,
        "type": "TextField",
        "x": 71,
        "y": 104,
        "width": "772",
        "height": 20,
        "value": "shall have parenting time with: (name(s) and birthdate(s) of child(ren))",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728038610157,
        "type": "TextField",
        "x": 71,
        "y": 173.33333333333334,
        "width": "772",
        "height": 20,
        "value": "shall have parenting time with: (name(s) and birthdate(s) of child(ren))",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728038610677,
        "type": "TextField",
        "x": 286,
        "y": 138.66666666666666,
        "width": "451",
        "height": 20,
        "value": "We agree that (name(s) of person(s) or party(ies))",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 47,
        "type": "CheckBox",
        "x": 55.333333333333336,
        "y": 640,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 48,
        "type": "CheckBox",
        "x": 55.333333333333336,
        "y": 454.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 49,
        "type": "CheckBox",
        "x": 55.333333333333336,
        "y": 363.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 50,
        "type": "CheckBox",
        "x": 238.66666666666666,
        "y": 330,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 51,
        "type": "CheckBox",
        "x": 193.33333333333334,
        "y": 330.6666666666667,
        "width": 20,
        "height": 20,
        "value": "unchecked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 51,
        "type": "CheckBox",
        "x": 193.33333333333334,
        "y": 330.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 52,
        "type": "CheckBox",
        "x": 54.666666666666664,
        "y": 674,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 2
      },
      {
        "id": 1728038808793,
        "type": "TextField",
        "x": 260,
        "y": 362.6666564941406,
        "width": 109,
        "height": 20,
        "value": "annual income of $ ....",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728038834150,
        "type": "TextField",
        "x": 403.3333333333333,
        "y": 362.6666768391927,
        "width": 274,
        "height": 20,
        "value": "(name of party)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728038858348,
        "type": "TextField",
        "x": 192.66666666666666,
        "y": 380,
        "width": 370,
        "height": 20,
        "value": "shall pay to (name of party)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728038871953,
        "type": "TextField",
        "x": 450,
        "y": 380,
        "width": 118,
        "height": 20,
        "value": "$ .... per month",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728038932836,
        "type": "TextField",
        "x": 72,
        "y": 416.00001017252606,
        "width": 773,
        "height": 20,
        "value": "for the following child(ren) (name(s) and birthdate(s) of child(ren))",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728039091796,
        "type": "TextField",
        "x": 221.33333333333334,
        "y": 434.00002034505206,
        "width": 207,
        "height": 20,
        "value": "with payment to begin on (date)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728039122195,
        "type": "TextField",
        "x": 153.33333333333334,
        "y": 452.44447835286456,
        "width": 186,
        "height": 20,
        "value": "Starting on (date)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728039151908,
        "type": "TextField",
        "x": 350.6666666666667,
        "y": 452.66664632161456,
        "width": 353,
        "height": 20,
        "value": "(name of party)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728039190493,
        "type": "TextField",
        "x": 456.6666666666667,
        "y": 470,
        "width": 121,
        "height": "20",
        "value": "$ ... for the ",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728039192349,
        "type": "TextField",
        "x": 182,
        "y": 470,
        "width": 397,
        "height": 20,
        "value": "shall pay (name of party)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728039350731,
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2,
        "type": "Table",
        "rows": 3,
        "columns": 5,
        "x": 72.66666666666667,
        "y": 541.9999796549479,
        "width": 769,
        "height": 136,
        "data": [
          [
            "Table - Childs Name",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ],
          [
            "",
            "",
            "",
            "",
            ""
          ]
        ]
      },
      {
        "id": 1728039402719,
        "type": "TextField",
        "x": 82.66666666666667,
        "y": 654.6667073567709,
        "width": 133,
        "height": 20,
        "value": "total annual income is $",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728039403304,
        "type": "TextField",
        "x": 373.3333333333333,
        "y": 705,
        "width": 180,
        "height": 20,
        "value": "shall be terminated as of (date)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728039403784,
        "type": "TextField",
        "x": 104.66666666666667,
        "y": 705,
        "width": 182,
        "height": "20",
        "value": "dated",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728039404232,
        "type": "TextField",
        "x": 71.33333333333333,
        "y": 688.6666463216146,
        "width": 750,
        "height": 20,
        "value": "with respect to the child(ren) (name(s) and birthdate(s) of child(ren))",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 2
      },
      {
        "id": 1728039741420,
        "type": "TextField",
        "x": 432.6666666666667,
        "y": 40,
        "width": 227,
        "height": 20,
        "value": "Court File Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 69,
        "type": "CheckBox",
        "x": 54.666666666666664,
        "y": 103.33333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 70,
        "type": "CheckBox",
        "x": 54.666666666666664,
        "y": 188,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1728039779320,
        "type": "TextField",
        "x": 330.6666666666667,
        "y": 184.6666717529297,
        "width": 311,
        "height": 20,
        "value": "support owed to (name of recipient)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728039779732,
        "type": "TextField",
        "x": 375.3333333333333,
        "y": 152,
        "width": 228,
        "height": 20,
        "value": "to begin on (date)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728039780144,
        "type": "TextField",
        "x": 81.33333333333333,
        "y": 152,
        "width": 141,
        "height": 20,
        "value": "$",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728039780328,
        "type": "TextField",
        "x": 396,
        "y": 134.66666666666666,
        "width": 285,
        "height": 20,
        "value": "shall pay (name of recipient)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728039780503,
        "type": "TextField",
        "x": 71.33333333333333,
        "y": 134.66666666666666,
        "width": 300,
        "height": 20,
        "value": "and (name of payor)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728039780804,
        "type": "TextField",
        "x": 267.3333333333333,
        "y": 118,
        "width": 226,
        "height": 20,
        "value": "as of (date)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728039780976,
        "type": "TextField",
        "x": 119.33333333333333,
        "y": 118,
        "width": 142,
        "height": 20,
        "value": "fixed at $",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728039781128,
        "type": "TextField",
        "x": 272.6666666666667,
        "y": 100.66666666666667,
        "width": 397,
        "height": 20,
        "value": "support owed to (name of recipient)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728039991459,
        "type": "TextField",
        "x": 116,
        "y": 202.6666717529297,
        "width": 155,
        "height": 20,
        "value": "fixed at $",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728039992463,
        "type": "TextField",
        "x": 273.3333333333333,
        "y": 202.6666717529297,
        "width": 229,
        "height": 20,
        "value": "as of (date)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728039993123,
        "type": "TextField",
        "x": 71.33333333333333,
        "y": 219.33333841959634,
        "width": 258,
        "height": 20,
        "value": "and (name of payor)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728039993675,
        "type": "TextField",
        "x": 420.6666666666667,
        "y": 219.33333841959634,
        "width": 247,
        "height": 20,
        "value": "shall pay (name of recipient)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728039994175,
        "type": "TextField",
        "x": 81.33333333333333,
        "y": 236.6666717529297,
        "width": 143,
        "height": 19,
        "value": "$",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728039994583,
        "type": "TextField",
        "x": 376.6666666666667,
        "y": 236.6666717529297,
        "width": 226,
        "height": 20,
        "value": "to begin on (date)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 86,
        "type": "CheckBox",
        "x": 56.666666666666664,
        "y": 510.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 87,
        "type": "CheckBox",
        "x": 57.333333333333336,
        "y": 418.6666666666667,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 88,
        "type": "CheckBox",
        "x": 57.333333333333336,
        "y": 368,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 89,
        "type": "CheckBox",
        "x": 56.666666666666664,
        "y": 317.3333333333333,
        "width": 20,
        "height": 20,
        "value": "checked",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "page": 3
      },
      {
        "id": 1728040248795,
        "type": "TextField",
        "x": 394,
        "y": 450.6666564941406,
        "width": 288,
        "height": 20,
        "value": "shall pay (name of recipient",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040249527,
        "type": "TextField",
        "x": 71.33333333333333,
        "y": 450.6666564941406,
        "width": 300,
        "height": 20,
        "value": "and (name of payor)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040250095,
        "type": "TextField",
        "x": 83.33333333333333,
        "y": 348.6666666666667,
        "width": 150,
        "height": 20,
        "value": "the amount of $",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040250535,
        "type": "TextField",
        "x": 382.6666666666667,
        "y": 348.6666768391927,
        "width": 223,
        "height": 20,
        "value": "with payment to begin on (date)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040250956,
        "type": "TextField",
        "x": 140.66666666666666,
        "y": 331.3333435058594,
        "width": 554,
        "height": 20,
        "value": "shall pay to (name of party)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040251283,
        "type": "TextField",
        "x": 140.66666666666666,
        "y": 314.6666768391927,
        "width": 570,
        "height": 20,
        "value": "(Name of party)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040286007,
        "type": "TextField",
        "x": 118,
        "y": 433.3333333333333,
        "width": 150,
        "height": 20,
        "value": "shall be fixed at $",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040286551,
        "type": "TextField",
        "x": 302,
        "y": 366.00001017252606,
        "width": 224,
        "height": 20,
        "value": "spousal support, dated",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040286767,
        "type": "TextField",
        "x": 273.3333333333333,
        "y": 432.6666768391927,
        "width": 227,
        "height": 20,
        "value": "as of (date)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040286895,
        "type": "TextField",
        "x": 286,
        "y": 416.00001017252606,
        "width": 377,
        "height": 20,
        "value": "support owed to (name of recipient)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040287043,
        "type": "TextField",
        "x": 102,
        "y": 382.6666768391927,
        "width": 228,
        "height": 20,
        "value": "shall be terminated as of (date)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040524103,
        "type": "TextField",
        "x": 82,
        "y": 467.55556233723956,
        "width": 142,
        "height": 20,
        "value": "$ per month",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040524631,
        "type": "TextField",
        "x": 375.3333333333333,
        "y": 467.3333333333333,
        "width": 228,
        "height": 20,
        "value": "payments to begin on (date)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040576603,
        "type": "TextField",
        "x": 343.3333333333333,
        "y": 507.33335367838544,
        "width": 364,
        "height": 20,
        "value": "support owed to (name of agency or other person)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040576979,
        "type": "TextField",
        "x": 377.3333333333333,
        "y": 560.0000203450521,
        "width": 225,
        "height": 20,
        "value": "payment to begin on (date)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040577371,
        "type": "TextField",
        "x": 82,
        "y": 560.0000203450521,
        "width": 143,
        "height": 20,
        "value": "$ per month",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040577747,
        "type": "TextField",
        "x": 72,
        "y": 542.6666870117188,
        "width": 282,
        "height": 20,
        "value": "and (name of payor)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040578127,
        "type": "TextField",
        "x": 384.6666666666667,
        "y": 542.8888956705729,
        "width": 302,
        "height": 20,
        "value": "shall pay (name of recipient)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040578475,
        "type": "TextField",
        "x": 310.6666666666667,
        "y": 526.0000203450521,
        "width": 242,
        "height": 20,
        "value": "as of (date)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040578731,
        "type": "TextField",
        "x": 156.66666666666666,
        "y": 526,
        "width": 150,
        "height": 20,
        "value": "shall be fixed at $",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040746501,
        "type": "TextField",
        "x": 418,
        "y": 648.6666666666666,
        "width": 154,
        "height": 20,
        "value": "specify which paragraphs of the order are to be changed",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040746930,
        "type": "TextField",
        "x": 450,
        "y": 666.8888956705729,
        "width": 180,
        "height": 20,
        "value": "dated",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040747302,
        "type": "TextField",
        "x": 164.66666666666666,
        "y": 666,
        "width": 374,
        "height": 21,
        "value": "of the order of Justice (name of judge)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 3
      },
      {
        "id": 1728040852658,
        "type": "TextField",
        "x": 431.3333333333333,
        "y": 37.33333841959635,
        "width": 230,
        "height": 20,
        "value": "Court File Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728042246539,
        "type": "TextField",
        "x": 111.33333333333333,
        "y": 226,
        "width": 150,
        "height": 20,
        "value": "Date of applicant's signature (Parties Certificate)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728042266123,
        "type": "TextField",
        "x": 388.6666666666667,
        "y": 225.33333333333334,
        "width": 150,
        "height": 20,
        "value": "Date of respondent's signature (Parties Certificate)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728042334187,
        "type": "TextField",
        "x": 73.33333333333333,
        "y": 302.00001017252606,
        "width": 282,
        "height": 20,
        "value": "Type or print name of witness to applicant's signature (Parties Certificate)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728042359555,
        "type": "TextField",
        "x": 353.3333333333333,
        "y": 302.6666768391927,
        "width": 298,
        "height": 20,
        "value": "Type or print name of witness to respondent's signature (Parties Certificate)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728042813015,
        "type": "TextField",
        "x": 31.333333333333332,
        "y": 340.6666768391927,
        "width": 395,
        "height": 20,
        "value": "Address of witness (Parties Certificate)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728042834454,
        "type": "TextField",
        "x": 326,
        "y": 341.3333435058594,
        "width": 390,
        "height": 20,
        "value": "Address of witness (Parties Certificate)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728042856342,
        "type": "TextField",
        "x": 72.66666666666667,
        "y": 378.6666564941406,
        "width": 271,
        "height": 20,
        "value": "Telephone number of witness (Parties Certificate)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728042887667,
        "type": "TextField",
        "x": 371.3333333333333,
        "y": 378.6666768391927,
        "width": 272,
        "height": 20,
        "value": "Telephone number of witness (Parties Certificate)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728043071847,
        "type": "TextField",
        "x": 390,
        "y": 440.8888651529948,
        "width": 191,
        "height": "20",
        "value": "Date of signature (Assignee's Consent)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728043108249,
        "type": "TextField",
        "x": 196,
        "y": 480.6666666666667,
        "width": 348,
        "height": 20,
        "value": "Print name and title of person of signing the consent (Assignee's Consent)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728043153238,
        "type": "TextField",
        "x": 332.6666666666667,
        "y": 517.1111246744791,
        "width": 308,
        "height": 20,
        "value": "Name of witness (type or print legibly) (Assignee's Consent)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728043196015,
        "type": "TextField",
        "x": 94,
        "y": 572.6666259765625,
        "width": 735,
        "height": 20,
        "value": "My name is: (Applicant's lawyer) (Lawyer's Certificate)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728043238817,
        "type": "TextField",
        "x": 100,
        "y": 628.8888956705729,
        "width": 194,
        "height": 20,
        "value": "Date (Lawyer's Certificate)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728043257638,
        "type": "TextField",
        "x": 98.66666666666667,
        "y": 716.6666666666666,
        "width": 195,
        "height": 20,
        "value": "Date (Lawyer's Certificate)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728043287380,
        "type": "TextField",
        "x": 94,
        "y": 660.6666666666666,
        "width": 736,
        "height": 20,
        "value": "My name is (Respondent's lawyer) (Lawyer's Certificate)",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 4
      },
      {
        "id": 1728043352474,
        "type": "TextField",
        "x": 437.3333333333333,
        "y": 42.6666514078776,
        "width": 211,
        "height": 20,
        "value": "Court File Number",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      },
      {
        "id": 1728043371198,
        "type": "TextArea",
        "x": 32.666666666666664,
        "y": 87.33333333333333,
        "width": 828,
        "height": 987,
        "value": "Schedule of Proposed changes",
        "fontSize": 10,
        "color": [
          0,
          0,
          0
        ],
        "background": "none",
        "border": "none",
        "page": 5
      }
    ]
  }



  return { staticFields };
};

export default StaticFields;