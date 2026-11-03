// ===== TASK 2: effects. Task 1 files are unchanged; this file plugs into them. =====
// (styles of the card, move and sort are in ../style.css)

let SORTED = {};   // room id -> true when the room is sorted by time

// ---- reset after every rebuild; add "Sort by time" buttons ----
$(document).on('built', () => {
  $('.pop,.fly').stop(true).remove();
  SORTED = {};
  $('.room h3').append('<button class="sort">Sort by time</button>');
});

// ---- 1. Spotlight + Clear ----
window.afterCase = $found => {
  const keep = $found.is('.room') ? $found.find('.guest') : $found;   // rooms: keep the guests inside
  $('.guest').not(keep).stop(true).fadeTo(300, 0.2);
};
$('<button id="clear">Clear</button>').insertAfter('#cases').on('click', () => {
  $('.guest').stop(true).css('top', 0).fadeTo(300, 1);
  $('.hit').removeClass('hit');
});

// ---- 2. Guest card: grows out of the avatar, shrinks back into it ----
function closeCard() {
  const $p = $('#pop'); if (!$p.length) return;
  const s = $p.data('s');
  $p.removeAttr('id').stop(true)                       // no longer "the" open card
    .animate({ left: s.l, top: s.t, width: s.w, height: s.w }, 200, function () { $(this).remove(); });
}

function openCard($g) {
  closeCard();                                         // only one card at a time
  const $av = $g.find('.av'), o = $av.offset(), w = $av.outerWidth(), W = 250;
  const THING = { phone: 'a phone', glasses: 'glasses', bag: 'a bag', cup: 'a cup', crumbs: 'cake crumbs' };
  const th = ($g.attr('data-things') || '').split(' ').filter(Boolean).map(t => THING[t]);
  const has = th.length ? 'Has ' + th.join(', ').replace(/, ([^,]*)$/, ' and $1') : 'Came with nothing';
  const $room = $g.closest('.room'), name = $g.attr('data-name');
  const buttons = $('.room').not($room).map(function () {
    return '<button class="mv" data-to="' + this.id + '">Move to the ' + $(this).find('h3 span').text().toLowerCase() + '</button>';
  }).get().join('');
  const $p = $('<div id="pop" class="pop">').attr('data-name', name).html(
    '<img class="pa" src="' + $av.attr('src') + '"><b class="pn">' + name + '</b>' +
    '<div class="pt">Came at ' + $g.attr('data-time') + '<br>' + ($g.is('.aitu') ? 'AITU student' : 'Not an AITU student') +
    '<br>' + has + '<br>Clothing: ' + $g.attr('data-color') + '<br>Room: ' + $room.find('h3 span').text() +
    '</div><div class="pm">' + buttons + '</div>').appendTo('body').css({ left: o.left, top: o.top, width: W, height: 'auto' });
  $p.find('.pa').css('border-color', $av.css('border-top-color'));
  const H = $p.outerHeight();                          // full size, measured once
  const L = Math.max(8, Math.min(o.left + w / 2 - W / 2, $(window).width() - W - 8));
  $p.data('s', { l: o.left, t: o.top, w: w }).css({ width: w, height: w })   // start small, on the photo
    .animate({ left: L, top: Math.max(8, o.top - 8), width: W, height: H }, 300);
}

$(document)
  .on('click', '.guest', function () { if (!$(this).is('.moving')) openCard($(this)); })
  .on('keydown', e => { if (e.key === 'Escape') closeCard(); })
  .on('click', e => { if (!$(e.target).closest('.pop,.guest').length) closeCard(); })
  .on('click', '#pop .mv', function () {
    const name = $('#pop').attr('data-name'), to = $(this).attr('data-to');
    closeCard(); move(name, to);
  })
  .on('click', '.sort', function () {
    const id = $(this).closest('.room').attr('id');
    SORTED[id] = !SORTED[id];
    $(this).text(SORTED[id] ? 'Picture order' : 'Sort by time');
    arrange(id);
  });

// ---- 3. Move: the array changes at once, the page follows with animation ----
function move(name, toId) {
  const $old = $('.guest[data-name=' + name + ']');
  const from = PARTY.find(r => r.guests.some(g => g.name === name)), to = PARTY.find(r => rid(r) === toId);
  if (!$old.length || $old.is('.moving') || !from || !to || from === to) return;   // ignore double clicks
  const g = from.guests.find(x => x.name === name);
  from.guests.splice(from.guests.indexOf(g), 1);       // so Task 1 cases find him in the new room
  to.guests.push(g);

  const W = $old.outerWidth(), o = $old.offset();
  const $fly = $old.clone().addClass('fly').css({ position: 'absolute', left: o.left, top: o.top, margin: 0, zIndex: 50 }).appendTo('body');
  const $new = card(g).addClass('moving')              // a new place opens at the end of the room
    .css({ visibility: 'hidden', overflow: 'hidden', width: 0, marginRight: 0, opacity: $old.css('opacity') })
    .appendTo('#' + toId + ' .guests');
  const t = $new.offset();                             // where the flying card must land

  $old.addClass('moving').css({ visibility: 'hidden', overflow: 'hidden' })   // the old place closes slowly
    .animate({ width: 0, marginRight: 0 }, 800, function () { $(this).remove(); });
  $new.animate({ width: W, marginRight: 4 }, 800);
  $fly.animate({ left: t.left, top: t.top }, 800, function () {
    $fly.remove();
    $new.css({ visibility: '', overflow: '' }).removeClass('moving');
    if (SORTED[toId]) arrange(toId);                   // keep a sorted room sorted
  });
}

// ---- 4. Sort by time (and back): DOM order changes at once, cards slide from old spots ----
function arrange(id) {
  const room = PARTY.find(r => rid(r) === id), $g = $('#' + id + ' .guests');
  const list = room.guests.slice();                    // array order = picture order
  if (SORTED[id]) list.sort((a, b) => a.time.localeCompare(b.time));
  const $c = $g.children().not('.moving').stop('slide', true);   // stop only the sliding, from where it is now
  $c.each(function () { $(this).data('x', $(this).offset().left); });
  list.forEach(x => $g.append($g.children('[data-name="' + x.name + '"]')));
  $c.each(function () {
    const $e = $(this).css('left', 0);
    $e.css('left', $e.data('x') - $e.offset().left)    // put it visually where it was ...
      .animate({ left: 0 }, { duration: 600, queue: 'slide' }).dequeue('slide');   // ... and slide to the new place
  });
}

$(document).trigger('built');   // first page was built before this file loaded
