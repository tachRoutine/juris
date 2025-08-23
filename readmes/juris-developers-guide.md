### Juris Developers Guide

## Overview
## **Object VDOM Structure** ##

```javascript
{tagName:{
    reactiveattributes:()=>getState('path.to.state', defaultvalue, subscribe?),//reactive
    staticattributes:getState('path.to.state', defaultvalue),//not reactive
    style:{
        color:getState('color', 'red'),
        backgroundColor:getState('backgroundColor', 'blue'),
    },
    //or
    style:()=>{
      const theme = getState('theme', 'light')
      return{
        color:theme === 'light' ? 'black' : 'white',
        backgroundColor:theme === 'light' ? 'white' : 'black',
      }
    },
    children:[
        ()=>getState('path.to.state', defaultvalue, subscribe?)//reactive anonymous function
        ()=>{
            if(getState('isActive',false)){
              return "Can return text"
            }
            if(getState('isGuest',false)){
              return;//return undefined
            }
            //return promise
            return myAsyncFunction().then(data=>{
              return {div:{
                text:data
              }}
            })
        },
        {Component:{}}
    ],
    //or reactive children
    children:()=>{
      const count = getState('count',0)
      return [{
        div:{
          text:count
        }
      }]
    },
    //or static children
    children:[
      {div:{
        text:"Static text"
      }}
    ],
    'data-testid':'testid'
    'data-count':()=>getState('count',0)//reactive data attribute
    'aria-label':'my aria label',
    'aria-count':()=>getState('count',0)//reactive aria attribute
    //all third party attributes are supported
    'hx-get':()=>getState('url',''),
  }
}

```