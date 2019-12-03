# LOPA

## Overview
Basic d3.js library for the flight seat layout, which will get render based on the configuration settings as user will define. Configuration settings explained in the usage.

## Example

```$
<!DOCTYPE HTML>
<html>
  <head>
    <link rel="stylesheet" href="./style.css" type="text/css">
  </head>
  <body>
	<div id="visualization"></div>

    <script src="./lopa.bundle.js" type="text/javascript"></script>

	<script type="text/javascript">
	
       window.onload = function () {
        const selector = document.getElementById('visualization');

        const options = {
        		"displayDeckName": true, 
        		"displayCabinClassName": true,
        		"onMouseOver" : function(seat) {},
        		"onClick" : myFunction(seat) {}
        		};
        
        const config = {
          "tailNumber": "XXXX",
          "deckConfig": [ 
              {
              "deckName": "upper",
              "cabinClassConfig": [ 
                {
                  "cabinClass": "Business Class",
                  "cabinClassName": "B/C",
                  "seatType": "large",
                  "seatConfig": "1-2-1",
                  "cabinClassOrder": 2,
                  "seatLetters": "AEFK",
                  "startRow": 56,
                  "endRow": 61,
                  "noSeats": []
                },
                {
                  "cabinClass": "First Class",
                  "cabinClassName": "F/C",
                  "seatType": "large",
                  "seatConfig": "2-2-2",
                  "cabinClassOrder": 1,
                  "seatLetters": "ABEFJK",
                  "startRow": 46,
                  "endRow": 50,
                  "noSeats": []
                },
                {
                  "cabinClass": "Economy Class",
                  "cabinClassName": "E/C",
                  "seatType": "small",
                  "seatConfig": "3-3-3",
                  "cabinClassOrder": 3,
                  "seatLetters": "ABCEFGIJK",
                  "startRow": 65,
                  "endRow": 90,
                  "noSeats": []
                }
             ],
              "data": [
                {
                  "seat": "46F",
                  "value": "3",
                  "background-color": "yellow",
                  "outline-color": "#cdcdcd",
                  "tooltip": "46F - Reset: 3"
                },
                {
                 "seat": "50A",
                  "value": "39",
                  "background-color": "#1e1e1e",
                  "outline-color": "red",
                  "tooltip": "50A - Reset: 39"
                }
              ]
            }
          ]
         }
         
          new Lopa(container, config, options);
        };
	  
    </script>
  </body>
</html>
```

## Loading

Install the Lopa using `npm`

> npm install lopa 

Load the lopa library and style file in the `index.html `
```$
<link rel="stylesheet" href="<path>/dist/style.css" type="text/css">

<script src="<path>/dist/lopa.bundle.js" type="text/javascript"></script>
```
Or import directly using `import`

```$
import { Lopa } from 'lopa';
```

## Usage

Create instance for the LOPA as follows

> **new Lopa ( selector, config, options )**

`selector` - css query selector to render the Lopa.

`config` - config argument will have all the neccessary settings to render Lopa

`options` - extra settings as whether to show labels, callback function and etc

## Data Format

#### config

| **Property** | **Type** | **Required** | **Description** |
| -------- | ----------- | -------- | ----------- |
| tailNumber | String | No | Filght tail number for flight identification |
| deckConfig | Array | Yes | Array can have one or two decks based on filght |
| deckName | String | Yes | Name of the deck should be displayed |
| cabinClassConfig | Array | Yes | Array can have one or more cabin class based on flight |
| cabinClass | String | Yes | Full name of the cabin class |
| cabinClassName | String | Yes | Identifier of the cabin class e.g, `"B/C" for Business Class` |
| seatType | String | Yes | Seat size will differ based on this property for cabin class. In econnomy class, seat will be small in size whereas in business class seat size is bigger. So this used to identify the seat size `seatType: "small" or "large"`.
| seatConfig | String | Yes | Seat column alignment data, has **' - '** as delimitter. e.g, `1-2-1` the alignment for thid will be one column, two columns and one column, each will be separated with minimum white space. |
| cabinClassOrder | Number | Yes | To arrange cabin classes in required order. It has to start with **' 1 '** and as follows as per the cabin class count. We can easily change the rendered order simply by changing this index. |
| seatLetters | String | Yes |  Seat letter to identify the row to render the seat. e.g, `ABEFJK` |
| startRow | Number | Yes | To identify the seat starting number of the cabin class |
| endRow | Number | Yes | To identify the seat ending number of the cabin class |
| noSeats | Array | Yes | This will remove the seat, when there is no seat in random places. e.g., `['8J', '36K']`|
| data | Array | Yes | This will have the data should be displayed in the seats with seat customization options such as `background-color`, `outline-color` and `tooltip` |
| seat | String | Yes | Seat number as identifier to modify the seat. e.g, `46F` |
| value | Number | Yes | Value should be displayed in the seat | 
| background-color | String | Yes | To change the seat background color. It can be color name or code  e.g, `red` or `#cdcdcd` |
| outline-color | String | Yes | To change the seat border color. It can be color name or code  e.g, `red` or `#cdcdcd` |
| tooltip | String | Yes | Used to display tooltip in respective seat mentioned in **seat** property. In order to show display for a seat, it has to be defined in tooltip. e.g, `46F - Reset: 3` |

#### options

| **Property** | **Type** | **Required** | **Description** |
| -------- | ----------- | -------- | ----------- |
| displayDeckName | Boolean | No | To display deck name on top of the seat layout. By default value will be `true`. If deck name display is not required, property should be defined as `false` |
| displayCabinClassName | Boolean | No | To display cabin name on top of the seat layout. By default value will be `true`. If cabin name display is not required, property should be defined as `false` |
| onMouseOver | Callback | No | To get the callback on mouse over of a seat. It will return an object with seat details |
| onClick | Callback | No | To get the callback on click of a seat. It will return an object with seat details |

## License

**All rights reserved to Thales Avionics, Inc.**
