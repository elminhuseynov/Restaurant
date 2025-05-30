
(function ( factory ) {


    if ( typeof define == 'function' && define.amd )
        define( 'picker', ['jquery'], factory )


    else if ( typeof exports == 'object' )
        module.exports = factory( require('jquery') )

    else this.Picker = factory( jQuery )

}(function( $ ) {

var $window = $( window )
var $document = $( document )
var $html = $( document.documentElement )
var supportsTransitions = document.documentElement.style.transition != null



function PickerConstructor( ELEMENT, NAME, COMPONENT, OPTIONS ) {

    if ( !ELEMENT ) return PickerConstructor


    var
        IS_DEFAULT_THEME = false,


    
        STATE = {
            id: ELEMENT.id || 'P' + Math.abs( ~~(Math.random() * new Date()) )
        },


     
        SETTINGS = COMPONENT ? $.extend( true, {}, COMPONENT.defaults, OPTIONS ) : OPTIONS || {},


    
        CLASSES = $.extend( {}, PickerConstructor.klasses(), SETTINGS.klass ),


      
        $ELEMENT = $( ELEMENT ),


      
        PickerInstance = function() {
            return this.start()
        },


        P = PickerInstance.prototype = {

            constructor: PickerInstance,

            $node: $ELEMENT,


        
            start: function() {

           
                if ( STATE && STATE.start ) return P


                STATE.methods = {}
                STATE.start = true
                STATE.open = false
                STATE.type = ELEMENT.type


                ELEMENT.autofocus = ELEMENT == getActiveElement()
                ELEMENT.readOnly = !SETTINGS.editable
                ELEMENT.id = ELEMENT.id || STATE.id
                if ( ELEMENT.type != 'text' ) {
                    ELEMENT.type = 'text'
                }


          
                P.component = new COMPONENT(P, SETTINGS)


                P.$root = $( '<div class="' + CLASSES.picker + '" id="' + ELEMENT.id + '_root" />' )
                prepareElementRoot()


                P.$holder = $( createWrappedComponent() ).appendTo( P.$root )
                prepareElementHolder()


                if ( SETTINGS.formatSubmit ) {
                    prepareElementHidden()
                }


              
                prepareElement()


          
                if ( SETTINGS.containerHidden ) $( SETTINGS.containerHidden ).append( P._hidden )
                else $ELEMENT.after( P._hidden )


                if ( SETTINGS.container ) $( SETTINGS.container ).append( P.$root )
                else $ELEMENT.after( P.$root )


            
                P.on({
                    start: P.component.onStart,
                    render: P.component.onRender,
                    stop: P.component.onStop,
                    open: P.component.onOpen,
                    close: P.component.onClose,
                    set: P.component.onSet
                }).on({
                    start: SETTINGS.onStart,
                    render: SETTINGS.onRender,
                    stop: SETTINGS.onStop,
                    open: SETTINGS.onOpen,
                    close: SETTINGS.onClose,
                    set: SETTINGS.onSet
                })


             
                IS_DEFAULT_THEME = isUsingDefaultTheme( P.$holder[0] )


              
                if ( ELEMENT.autofocus ) {
                    P.open()
                }


                return P.trigger( 'start' ).trigger( 'render' )
            }, 
            render: function( entireComponent ) {

                if ( entireComponent ) {
                    P.$holder = $( createWrappedComponent() )
                    prepareElementHolder()
                    P.$root.html( P.$holder )
                }
                else P.$root.find( '.' + CLASSES.box ).html( P.component.nodes( STATE.open ) )

                return P.trigger( 'render' )
            }, 


          
            stop: function() {

             
                if ( !STATE.start ) return P

             
                P.close()

              
                if ( P._hidden ) {
                    P._hidden.parentNode.removeChild( P._hidden )
                }

               
                P.$root.remove()

              
                $ELEMENT.removeClass( CLASSES.input ).removeData( NAME )
                setTimeout( function() {
                    $ELEMENT.off( '.' + STATE.id )
                }, 0)

                ELEMENT.type = STATE.type
                ELEMENT.readOnly = false

              
                P.trigger( 'stop' )

          
                STATE.methods = {}
                STATE.start = false

                return P
            }, 

            
            open: function( dontGiveFocus ) {

              
                if ( STATE.open ) return P

                $ELEMENT.addClass( CLASSES.active )
                aria( ELEMENT, 'expanded', true )

                
                setTimeout( function() {

                
                    P.$root.addClass( CLASSES.opened )
                    aria( P.$root[0], 'hidden', false )

                }, 0 )

            
                if ( dontGiveFocus !== false ) {

               
                    STATE.open = true

                    if ( IS_DEFAULT_THEME ) {
                        $html.
                            css( 'overflow', 'hidden' ).
                            css( 'padding-right', '+=' + getScrollbarWidth() )
                    }

                    focusPickerOnceOpened()

                
                    $document.on( 'click.' + STATE.id + ' focusin.' + STATE.id, function( event ) {

                        var target = getRealEventTarget( event, ELEMENT )

                      
                        if ( ! event.isSimulated && target != ELEMENT && target != document && event.which != 3 ) {

                    
                            P.close( target === P.$holder[0] )
                        }

                    }).on( 'keydown.' + STATE.id, function( event ) {

                        var
                         
                            keycode = event.keyCode,

                            
                            keycodeToMove = P.component.key[ keycode ],

                           
                            target = getRealEventTarget( event, ELEMENT )


                        
                        if ( keycode == 27 ) {
                            P.close( true )
                        }


                   
                        else if ( target == P.$holder[0] && ( keycodeToMove || keycode == 13 ) ) {

                         
                            event.preventDefault()

                          
                            if ( keycodeToMove ) {
                                PickerConstructor._.trigger( P.component.key.go, P, [ PickerConstructor._.trigger( keycodeToMove ) ] )
                            }

                            else if ( !P.$root.find( '.' + CLASSES.highlighted ).hasClass( CLASSES.disabled ) ) {
                                P.set( 'select', P.component.item.highlight )
                                if ( SETTINGS.closeOnSelect ) {
                                    P.close( true )
                                }
                            }
                        }


                       
                        else if ( $.contains( P.$root[0], target ) && keycode == 13 ) {
                            event.preventDefault()
                            target.click()
                        }
                    })
                }

                
                return P.trigger( 'open' )
            }, 


       
            close: function( giveFocus ) {

                if ( giveFocus ) {
                    if ( SETTINGS.editable ) {
                        ELEMENT.focus()
                    }
                    else {
                        
                        P.$holder.off( 'focus.toOpen' ).focus()
                        setTimeout( function() {
                            P.$holder.on( 'focus.toOpen', handleFocusToOpenEvent )
                        }, 0 )
                    }
                }

              
                $ELEMENT.removeClass( CLASSES.active )
                aria( ELEMENT, 'expanded', false )

              
                setTimeout( function() {

                    
                    P.$root.removeClass( CLASSES.opened + ' ' + CLASSES.focused )
                    aria( P.$root[0], 'hidden', true )

                }, 0 )

               
                if ( !STATE.open ) return P

               
                STATE.open = false

              
                if ( IS_DEFAULT_THEME ) {
                    $html.
                        css( 'overflow', '' ).
                        css( 'padding-right', '-=' + getScrollbarWidth() )
                }

                
                $document.off( '.' + STATE.id )

              
                return P.trigger( 'close' )
            }, 

            
            clear: function( options ) {
                return P.set( 'clear', null, options )
            },


           
            set: function( thing, value, options ) {

                var thingItem, thingValue,
                    thingIsObject = $.isPlainObject( thing ),
                    thingObject = thingIsObject ? thing : {}

             
                options = thingIsObject && $.isPlainObject( value ) ? value : options || {}

                if ( thing ) {

                  
                    if ( !thingIsObject ) {
                        thingObject[ thing ] = value
                    }

                   
                    for ( thingItem in thingObject ) {

                        
                        thingValue = thingObject[ thingItem ]

                       
                        if ( thingItem in P.component.item ) {
                            if ( thingValue === undefined ) thingValue = null
                            P.component.set( thingItem, thingValue, options )
                        }

                  
                        if ( ( thingItem == 'select' || thingItem == 'clear' ) && SETTINGS.updateInput ) {
                            $ELEMENT.
                                val( thingItem == 'clear' ? '' : P.get( thingItem, SETTINGS.format ) ).
                                trigger( 'change' )
                        }
                    }

                   
                    P.render()
                }

            
                return options.muted ? P : P.trigger( 'set', thingObject )
            },


           
            get: function( thing, format ) {

                thing = thing || 'value'

             
                if ( STATE[ thing ] != null ) {
                    return STATE[ thing ]
                }

               
                if ( thing == 'valueSubmit' ) {
                    if ( P._hidden ) {
                        return P._hidden.value
                    }
                    thing = 'value'
                }

            
                if ( thing == 'value' ) {
                    return ELEMENT.value
                }

               
                if ( thing in P.component.item ) {
                    if ( typeof format == 'string' ) {
                        var thingValue = P.component.get( thing )
                        return thingValue ?
                            PickerConstructor._.trigger(
                                P.component.formats.toString,
                                P.component,
                                [ format, thingValue ]
                            ) : ''
                    }
                    return P.component.get( thing )
                }
            },



           
            on: function( thing, method, internal ) {

                var thingName, thingMethod,
                    thingIsObject = $.isPlainObject( thing ),
                    thingObject = thingIsObject ? thing : {}

                if ( thing ) {

               
                    if ( !thingIsObject ) {
                        thingObject[ thing ] = method
                    }

               
                    for ( thingName in thingObject ) {

                       
                        thingMethod = thingObject[ thingName ]

                  
                        if ( internal ) {
                            thingName = '_' + thingName
                        }

                        STATE.methods[ thingName ] = STATE.methods[ thingName ] || []

                      
                        STATE.methods[ thingName ].push( thingMethod )
                    }
                }

                return P
            }, 



        
            off: function() {
                var i, thingName,
                    names = arguments;
                for ( i = 0, namesCount = names.length; i < namesCount; i += 1 ) {
                    thingName = names[i]
                    if ( thingName in STATE.methods ) {
                        delete STATE.methods[thingName]
                    }
                }
                return P
            },


           
            trigger: function( name, data ) {
                var _trigger = function( name ) {
                    var methodList = STATE.methods[ name ]
                    if ( methodList ) {
                        methodList.map( function( method ) {
                            PickerConstructor._.trigger( method, P, [ data ] )
                        })
                    }
                }
                _trigger( '_' + name )
                _trigger( name )
                return P
            } 
        } 


   
    function createWrappedComponent() {

        
        return PickerConstructor._.node( 'div',

           
            PickerConstructor._.node( 'div',

               
                PickerConstructor._.node( 'div',

                  
                    PickerConstructor._.node( 'div',

                        P.component.nodes( STATE.open ),

                       
                        CLASSES.box
                    ),

                   
                    CLASSES.wrap
                ),

              
                CLASSES.frame
            ),

           
            CLASSES.holder,

            'tabindex="-1"'
        ) 
    } 



    
    function prepareElement() {

        $ELEMENT.

            
            data(NAME, P).

           
            addClass(CLASSES.input).

            
            val( $ELEMENT.data('value') ?
                P.get('select', SETTINGS.format) :
                ELEMENT.value
            ).

            
            on( 'focus.' + STATE.id + ' click.' + STATE.id, function(event) {
                event.preventDefault()
                P.open()
            })

        
        if ( !SETTINGS.editable ) {

            $ELEMENT.

                
                on( 'keydown.' + STATE.id, handleKeydownEvent )
        }


    
        aria(ELEMENT, {
            haspopup: true,
            expanded: false,
            readonly: false,
            owns: ELEMENT.id + '_root'
        })
    }


    function prepareElementRoot() {
        aria( P.$root[0], 'hidden', true )
    }


     
    function prepareElementHolder() {

        P.$holder.

            on({

                keydown: handleKeydownEvent,

                'focus.toOpen': handleFocusToOpenEvent,

                blur: function() {
                  
                    $ELEMENT.removeClass( CLASSES.target )
                },

                
                focusin: function( event ) {
                    P.$root.removeClass( CLASSES.focused )
                    event.stopPropagation()
                },

               
                'mousedown click': function( event ) {

                    var target = getRealEventTarget( event, ELEMENT )

                   
                    if ( target != P.$holder[0] ) {

                        event.stopPropagation()

                        
                        if ( event.type == 'mousedown' && !$( target ).is( 'input, select, textarea, button, option' )) {

                            event.preventDefault()

                            P.$holder.eq(0).focus()
                        }
                    }
                }

            }).

            
            on( 'click', '[data-pick], [data-nav], [data-clear], [data-close]', function() {

                var $target = $( this ),
                    targetData = $target.data(),
                    targetDisabled = $target.hasClass( CLASSES.navDisabled ) || $target.hasClass( CLASSES.disabled ),

                    activeElement = getActiveElement()
                    activeElement = activeElement && ( (activeElement.type || activeElement.href ) ? activeElement : null);

                if ( targetDisabled || activeElement && !$.contains( P.$root[0], activeElement ) ) {
                    P.$holder.eq(0).focus()
                }

        
                if ( !targetDisabled && targetData.nav ) {
                    P.set( 'highlight', P.component.item.highlight, { nav: targetData.nav } )
                }

                
                else if ( !targetDisabled && 'pick' in targetData ) {
                    P.set( 'select', targetData.pick )
                    if ( SETTINGS.closeOnSelect ) {
                        P.close( true )
                    }
                }

              
                else if ( targetData.clear ) {
                    P.clear()
                    if ( SETTINGS.closeOnClear ) {
                        P.close( true )
                    }
                }

                else if ( targetData.close ) {
                    P.close( true )
                }

            })

    }


     
    function prepareElementHidden() {

        var name

        if ( SETTINGS.hiddenName === true ) {
            name = ELEMENT.name
            ELEMENT.name = ''
        }
        else {
            name = [
                typeof SETTINGS.hiddenPrefix == 'string' ? SETTINGS.hiddenPrefix : '',
                typeof SETTINGS.hiddenSuffix == 'string' ? SETTINGS.hiddenSuffix : '_submit'
            ]
            name = name[0] + ELEMENT.name + name[1]
        }

        P._hidden = $(
            '<input ' +
            'type=hidden ' +

            'name="' + name + '"' +

            (
                $ELEMENT.data('value') || ELEMENT.value ?
                    ' value="' + P.get('select', SETTINGS.formatSubmit) + '"' :
                    ''
            ) +
            '>'
        )[0]

        $ELEMENT.

            on('change.' + STATE.id, function() {
                P._hidden.value = ELEMENT.value ?
                    P.get('select', SETTINGS.formatSubmit) :
                    ''
            })
    }


 
    function focusPickerOnceOpened() {

        if (IS_DEFAULT_THEME && supportsTransitions) {
            P.$holder.find('.' + CLASSES.frame).one('transitionend', function() {
                P.$holder.eq(0).focus()
            })
        }
        else {
            setTimeout(function() {
                P.$holder.eq(0).focus()
            }, 0)
        }
    }


    function handleFocusToOpenEvent(event) {

        event.stopPropagation()

       
        $ELEMENT.addClass( CLASSES.target )

        
        P.$root.addClass( CLASSES.focused )

        P.open()
    }


  
    function handleKeydownEvent( event ) {

        var keycode = event.keyCode,

            isKeycodeDelete = /^(8|46)$/.test(keycode)

        if ( keycode == 27 ) {
            P.close( true )
            return false
        }

       
        if ( keycode == 32 || isKeycodeDelete || !STATE.open && P.component.key[keycode] ) {

            
            event.preventDefault()
            event.stopPropagation()

           
            if ( isKeycodeDelete ) { P.clear().close() }
            else { P.open() }
        }
    }


    
    return new PickerInstance()
} 




PickerConstructor.klasses = function( prefix ) {
    prefix = prefix || 'picker'
    return {

        picker: prefix,
        opened: prefix + '--opened',
        focused: prefix + '--focused',

        input: prefix + '__input',
        active: prefix + '__input--active',
        target: prefix + '__input--target',

        holder: prefix + '__holder',

        frame: prefix + '__frame',
        wrap: prefix + '__wrap',

        box: prefix + '__box'
    }
} 




function isUsingDefaultTheme( element ) {

    var theme,
        prop = 'position'

  
    if ( element.currentStyle ) {
        theme = element.currentStyle[prop]
    }

    
    else if ( window.getComputedStyle ) {
        theme = getComputedStyle( element )[prop]
    }

    return theme == 'fixed'
}




function getScrollbarWidth() {

    if ( $html.height() <= $window.height() ) {
        return 0
    }

    var $outer = $( '<div style="visibility:hidden;width:100px" />' ).
        appendTo( 'body' )

   
    var widthWithoutScroll = $outer[0].offsetWidth

    $outer.css( 'overflow', 'scroll' )

    var $inner = $( '<div style="width:100%" />' ).appendTo( $outer )

    
    var widthWithScroll = $inner[0].offsetWidth

    
    $outer.remove()

    return widthWithoutScroll - widthWithScroll
}




function getRealEventTarget( event, ELEMENT ) {

    var path = []

    if ( event.path ) {
        path = event.path
    }

    if ( event.originalEvent && event.originalEvent.path ) {
        path = event.originalEvent.path
    }

    if ( path && path.length > 0 ) {
        if ( ELEMENT && path.indexOf( ELEMENT ) >= 0 ) {
            return ELEMENT
        } else {
            return path[0]
        }
    }

    return event.target
}



PickerConstructor._ = {

    
    group: function( groupObject ) {

        var
           
            loopObjectScope,

            nodesList = '',

            counter = PickerConstructor._.trigger( groupObject.min, groupObject )


        for ( ; counter <= PickerConstructor._.trigger( groupObject.max, groupObject, [ counter ] ); counter += groupObject.i ) {

            loopObjectScope = PickerConstructor._.trigger( groupObject.item, groupObject, [ counter ] )

           
            nodesList += PickerConstructor._.node(
                groupObject.node,
                loopObjectScope[ 0 ],   
                loopObjectScope[ 1 ],   
                loopObjectScope[ 2 ]    
            )
        }

        
        return nodesList
    }, 


    
    node: function( wrapper, item, klass, attribute ) {

        
        if ( !item ) return ''

        item = $.isArray( item ) ? item.join( '' ) : item

      
        klass = klass ? ' class="' + klass + '"' : ''

        attribute = attribute ? ' ' + attribute : ''

      
        return '<' + wrapper + klass + attribute + '>' + item + '</' + wrapper + '>'
    }, 


   
    lead: function( number ) {
        return ( number < 10 ? '0': '' ) + number
    },


   
    trigger: function( callback, scope, args ) {
        return typeof callback == 'function' ? callback.apply( scope, args || [] ) : callback
    },


    
    digits: function( string ) {
        return ( /\d/ ).test( string[ 1 ] ) ? 2 : 1
    },


    
    isDate: function( value ) {
        return {}.toString.call( value ).indexOf( 'Date' ) > -1 && this.isInteger( value.getDate() )
    },


    isInteger: function( value ) {
        return {}.toString.call( value ).indexOf( 'Number' ) > -1 && value % 1 === 0
    },


    
    ariaAttr: ariaAttr
} 




PickerConstructor.extend = function( name, Component ) {

    $.fn[ name ] = function( options, action ) {

        
        var componentData = this.data( name )

       
        if ( options == 'picker' ) {
            return componentData
        }

      
        if ( componentData && typeof options == 'string' ) {
            return PickerConstructor._.trigger( componentData[ options ], componentData, [ action ] )
        }

        
        return this.each( function() {
            var $this = $( this )
            if ( !$this.data( name ) ) {
                new PickerConstructor( this, name, Component, options )
            }
        })
    }

   
    $.fn[ name ].defaults = Component.defaults
} 



function aria(element, attribute, value) {
    if ( $.isPlainObject(attribute) ) {
        for ( var key in attribute ) {
            ariaSet(element, key, attribute[key])
        }
    }
    else {
        ariaSet(element, attribute, value)
    }
}
function ariaSet(element, attribute, value) {
    element.setAttribute(
        (attribute == 'role' ? '' : 'aria-') + attribute,
        value
    )
}
function ariaAttr(attribute, data) {
    if ( !$.isPlainObject(attribute) ) {
        attribute = { attribute: data }
    }
    data = ''
    for ( var key in attribute ) {
        var attr = (key == 'role' ? '' : 'aria-') + key,
            attrVal = attribute[key]
        data += attrVal == null ? '' : attr + '="' + attribute[key] + '"'
    }
    return data
}


function getActiveElement() {
    try {
        return document.activeElement
    } catch ( err ) { }
}



return PickerConstructor


}));
