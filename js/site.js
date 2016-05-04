$(document).on('click', 'a[href*="#"]', function(e) {
  var $anchor = $(this),
      hash = $anchor.attr('href'),
      url = hash.substr(0, hash.indexOf('#'));
  hash = hash.substr(hash.indexOf('#'));

  // if it is just the hash, we should reset it to body, which will make it scroll to the top of the page.
  if (hash == '#') hash = 'body';

  // check if we have an url, and if it is on the current page and the element exists
  if ((url == '' || url.indexOf(document.location.pathname) >= 0) && $(hash).length > 0) {
    $('html, body').stop().animate({
      scrollTop: $(hash).offset().top
    }, 1000);
  }
});

// Highlight the top nav as scrolling occurs
$('body').scrollspy({
  target: '.navbar-fixed-top'
});

// Closes the Responsive Menu on Menu Item Click
$('.navbar-collapse ul li a').click(function() {
  $('.navbar-toggle:visible').click();
});

// add class on menu
$(window).scroll(function() {
  if ($(this).scrollTop() > 1) {
    $('nav.navbar').addClass('navbar-shrink');
  }
  else {
    $('nav.navbar').removeClass('navbar-shrink');
  }
});
