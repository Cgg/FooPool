/* FooPool
 *
 * A kind of pool simulation in JavaScript. Quite basic for now:
 * - the field is the canvas (same coordinate system)
 * - the user can give direct impulse to the ball only (no spin)
 * - basic bouncing behaviour against the edges
 * - only one ball
 * - no fancy visual effects
 */

/* Some guidelines I try to stick with :
 * 
 * - variables declarations are sorted between the different objects (ball,
 * field, ...) and the variable name is prefixed accordingly
 * - local variables may not use prefixes
 * - after the prefix I use camel case for the variables and underscore
 * separated uppercase for the constants
 * - if a variable is a constant its name is in uppercase (not the prefix)
 */

init = function()
{
  /* Wonderful html world */
  h_canvas = document.getElementById( "mainCanvas" );
  h_stats  = document.getElementById( "statistic" );
  h_x      = document.getElementById( "x" );
  h_y      = document.getElementById( "y" );
  h_sx      = document.getElementById( "sx" );
  h_sy      = document.getElementById( "sy" );
  h_ax      = document.getElementById( "ax" );
  h_ay      = document.getElementById( "ay" );

  /* game variables */
  g_F_SCALE  = 8;    // scaling factor applied to the graphic vector to get
                     // force applied to the ball
  g_M_T_OUT  = 750;  // Time out : if the user doesn't move the mouse within 
                     // that time the move is reset (in ms)

  g_EPS      = 1.5; // something almost zero (pixel wise)

  g_m_timer  = 0;
  g_dtDraw   = 33; // in ms
  g_dtUpdate = 33;

  /* Field */
  f_W = h_canvas.width
  f_H = h_canvas.height
  f_F = 0.2;             // friction factor of the field

  h_stats.style.width = f_W;

  /* Balls of steel */
  b_C_FR  = "rgb( 255, 94, 94 )";   // ball's color if not clicked
  b_C_CLK = "rgb( 121, 125, 242 )"; // ball's color if clicked
  b_C_HVR = "rgb( 150, 255, 150 )"; // ball's hover zone color
  b_R     = 10;      // ball's radius
  b_R_SP  = 40;      // radius for the "spin zone"
  b_WGT   = 0.21;    // ball's weight (in kg)
  b_x     = f_W / 2; // position
  b_y     = f_H / 2;
  b_sx    = 0;       // speed
  b_sy    = 0;
  b_ax    = 0;       // acceleration
  b_ay    = 0;
  b_click = false;   // b_click : the user clicked on the ball
  b_hover = false;   // b_hover : the mouse is hover the ball
  b_pClic = { X : 0, Y : 0 }; // point from where the user start to click
  b_force = { X : 0, Y : 0 }; // vertice of force applied to the ball

  h_canvas.addEventListener( "mousedown", onMouseDown, false );
  h_canvas.addEventListener( "mouseup"  , onMouseUp  , false );
  h_canvas.addEventListener( "mousemove", onMouseMove, false );

  setInterval( "draw()", g_dtDraw );
  setInterval( "update( g_dtUpdate / 1000 )", g_dtUpdate );
}


/* mouse events handlers */
onMouseDown = function( evt )
{
  var cursorPostion = getCursorPos( evt );

  // check if we are in the clickable zone
  if( b_hover )
  {
    b_click = true;

    // if we are somewhere in the ball we stick the start point to the
    // middle of the ball
    if( Math.sqrt( Math.pow( b_x - cursorPostion.X, 2 ) +
                   Math.pow( b_y - cursorPostion.Y, 2 )   ) <= b_R )
    {
      b_hover = false;

      b_pClic.X = b_x;
      b_pClic.Y = b_y;
    }
    else
    {
      b_pClic.X = cursorPostion.X;
      b_pClic.Y = cursorPostion.Y;
    }

    b_force.X = 0;
    b_force.Y = 0;
  }

  g_m_timer = setTimeout( "mouseMoveTimeout()", g_M_T_OUT );
}

onMouseUp = function( evt )
{
  // we have to check for b_click since the user could have cancelled his
  // move by waiting for g_M_T_OUT to expire.
  if( b_click )
  {
    b_click = false;
    b_hover = false;

    var force = { X : b_force.X * g_F_SCALE, Y : b_force.Y * g_F_SCALE };

    b_ax = force.X / b_WGT;
    b_ay = force.Y / b_WGT;

    // bof
    b_sx = b_ax * g_dtUpdate / 1000;
    b_sy = b_ay * g_dtUpdate / 1000;

    h_canvas.removeEventListener( "mousedown", onMouseDown );
    h_canvas.removeEventListener( "mouseup"  , onMouseUp   );
    h_canvas.removeEventListener( "mousemove", onMouseMove );
  }
}

onMouseMove = function( evt )
{
  var cursorPostion = getCursorPos( evt );

  if( b_click )
  {
    clearTimeout( g_m_timer );

    b_force.X = cursorPostion.X - b_pClic.X;
    b_force.Y = cursorPostion.Y - b_pClic.Y;

    g_m_timer = setTimeout( "mouseMoveTimeout()", g_M_T_OUT );
  }
  else
  {
    b_hover = ( Math.sqrt( Math.pow( b_x - cursorPostion.X, 2 ) +
                           Math.pow( b_y - cursorPostion.Y, 2 )   ) <= b_R_SP );
  }
}

mouseMoveTimeout = function()
{
  b_click = false;
}

/* Compute cursor postion from a mouse event */
getCursorPos = function( mouseEvt )
{
  var x;
  var y;

  if( mouseEvt.pageX != undefined && mouseEvt.pageY != undefined )
  {
    x = mouseEvt.pageX;
    y = mouseEvt.pageY;
  }
  else
  {
    x = mouseEvt.clientX + document.body.scrollLeft +
    document.documentElement.scrollLeft;

    y = mouseEvt.clientY +
    document.body.scrollTop + document.documentElement.scrollTop;
  }

  x -= h_canvas.offsetLeft;
  y -= h_canvas.offsetTop;

  var pos = { X : x, Y : y };

  return pos;
}


/* Responsible for drawing everything on the screen */
draw = function()
{
  var ctx = h_canvas.getContext( "2d" );

  ctx.save();

  ctx.clearRect( 0, 0, f_W, f_H );

  // draw the ball
  ctx.strokeStyle = "#000";
  ctx.lineWidth   = 2;

  if( b_hover )
  {
    ctx.fillStyle = b_C_HVR;

    ctx.beginPath();

    ctx.arc( b_x, b_y, b_R_SP, 0, Math.PI*2 );

    ctx.fill();

    ctx.closePath();

    if( b_click )
    {

      // draw axis in the hover zone
      angle = - Math.atan( b_force.X / b_force.Y );

      angle = ( b_force.Y < 0 ? angle : angle + Math.PI );

      ctx.save();

      ctx.translate( b_x, b_y );
      ctx.rotate( angle );

      ctx.strokeStyle = "rgba( 0, 0, 0, 200 )";
      ctx.lineWidth   = 1;

      ctx.beginPath();

      ctx.moveTo( 0, b_R_SP );
      ctx.lineTo( 0, -b_R_SP );
      ctx.lineTo( -5, -b_R_SP + 5 );
      ctx.moveTo( 0, -b_R_SP );
      ctx.lineTo( 5, -b_R_SP + 5 );

      ctx.moveTo( -b_R_SP, 0 );
      ctx.lineTo( b_R_SP, 0 );
      ctx.lineTo( b_R_SP - 5, - 5 );
      ctx.moveTo( b_R_SP, 0 );
      ctx.lineTo( b_R_SP - 5, 5 );

      ctx.stroke();

      ctx.closePath();

      ctx.restore();
    }
  }

  if( b_click )
  {
    ctx.fillStyle = b_C_CLK;
  }
  else
  {
    ctx.fillStyle = b_C_FR;
  }

  ctx.beginPath();
  ctx.arc( b_x, b_y, b_R, 0, Math.PI*2 );

  if( b_click )
  {
    ctx.moveTo( b_pClic.X, b_pClic.Y );
    ctx.lineTo( b_pClic.X + b_force.X, b_pClic.Y + b_force.Y );
  }

  ctx.closePath();

  ctx.fill();
  ctx.stroke();

  ctx.restore();
}


/* Update objects' properties with a dt timestep */
update = function( dt )
{
  var friction = { X : -b_sx * f_F, Y : -b_sy * f_F };

  b_ax = friction.X / b_WGT;
  b_ay = friction.Y / b_WGT;

  b_sx = b_sx + ( b_ax * dt );
  b_sy = b_sy + ( b_ay * dt );

  b_x = b_x + ( b_sx * dt );
  b_y = b_y + ( b_sy * dt );

  // if ball stopped then the user can click again.
  if( Math.abs( b_sx ) < g_EPS && Math.abs( b_sy ) < g_EPS &&
      Math.abs( b_ax ) < g_EPS && Math.abs( b_ay ) < g_EPS )
  {
    b_sx = b_sy = b_ax = b_ay = 0.0;

    h_canvas.addEventListener( "mousedown", onMouseDown, false );
    h_canvas.addEventListener( "mouseup"  , onMouseUp  , false );
    h_canvas.addEventListener( "mousemove", onMouseMove, false );
  }

  h_x.innerHTML = Math.round( b_x * 100 ) / 100;
  h_y.innerHTML = Math.round( b_y * 100 ) / 100;

  h_sx.innerHTML = Math.round( b_sx * 100 ) / 100;
  h_sy.innerHTML = Math.round( b_sy * 100 ) / 100;

  h_ax.innerHTML = Math.round( b_ax * 100 ) / 100;
  h_ay.innerHTML = Math.round( b_ay * 100 ) / 100;

  // now seems like a good time to detect and handle collisions
}
