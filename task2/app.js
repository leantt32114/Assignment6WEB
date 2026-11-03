// ===== 1. DATA: the party from the picture (guests from left to right) =====
const G = (name, color, time, aitu, things = '') =>
  ({ name, color, time, aitu: !!aitu, things: things ? things.split(' ') : [] });

const PARTY = [
  { room: 'Balcony', floor: 2, guests: [
    G('Aigerim', 'green', '20:45', 1, 'cup crumbs'), G('Aliya', 'black', '21:15', 0, 'phone cup'),
    G('Madina', 'green', '22:10', 0, 'phone bag crumbs'), G('Ivan', 'black', '20:10', 1, 'cup')] },
  { room: 'Hall', floor: 2, guests: [
    G('Arman', 'yellow', '20:35', 0, 'bag glasses'), G('Sophia', 'purple', '21:20', 1, 'phone'),
    G('Dias', 'green', '19:45', 1), G('Bekzat', 'purple', '20:55', 0, 'bag cup crumbs'),
    G('Aruzhan', 'black', '21:50', 1, 'phone'), G('Saule', 'green', '21:25', 0, 'glasses')] },
  { room: 'Kitchen', floor: 1, guests: [
    G('Nurlan', 'red', '19:40', 1, 'phone cup'), G('Emma', 'black', '20:15', 0, 'bag'),
    G('Timur', 'green', '21:05', 1, 'phone bag crumbs'), G('Sergey', 'yellow', '20:50', 0),
    G('Yerlan', 'red', '21:40', 1, 'glasses phone'), G('Kamila', 'black', '20:05', 0, 'cup')] },
  { room: 'Living room', floor: 1, guests: [
    G('Daniel', 'blue', '19:55', 0, 'glasses'), G('Zarina', 'green', '21:10', 0, 'bag phone crumbs'),
    G('Natasha', 'yellow', '20:30', 1), G('Askar', 'black', '21:00', 1, 'phone'),
    G('Inkar', 'purple', '20:20', 0, 'bag')] }
];

// ===== 2. BUILD THE PAGE FROM THE ARRAY =====
const ICON = { phone: '📱', glasses: '👓', bag: '👜', cup: '☕', crumbs: '🍰' };
const rid = r => r.room.toLowerCase().replace(' ', '-');   // "Living room" -> "living-room"

function card(g) {
  return $('<div class="guest">')
    .addClass('c-' + g.color)
    .toggleClass('aitu', g.aitu)
    .addClass(g.things.map(t => 'has-' + t).join(' '))
    .attr({ 'data-name': g.name, 'data-color': g.color, 'data-time': g.time, 'data-things': g.things.join(' ') })
    .append($('<img class="av">').attr('src', 'https://api.dicebear.com/9.x/open-peeps/svg?seed=' + g.name))
    .append($('<b class="nm">').text(g.name), $('<small>').text('🕒 ' + g.time),
            $('<div class="th">').text(g.things.map(t => ICON[t]).join(' ')))
    .append(g.aitu ? '<i class="bd">🎓</i>' : '');
}

function build() {
  const $house = $('#house').empty();
  [2, 1].forEach(f => {
    const $floor = $('<section class="floor">').attr('id', 'floor' + f).append($('<div class="fl">').text('FLOOR ' + f));
    PARTY.filter(r => r.floor === f).forEach(r => {
      const $guests = $('<div class="guests">');
      r.guests.forEach(g => $guests.append(card(g)));
      $floor.append($('<div class="room">').attr('id', rid(r)).append($('<h3>').append($('<span>').text(r.room)), $guests));
    });
    $house.append($floor);
  });
  $(document).trigger('built');
}

// ===== 3. THE 20 CASES: each one is ONE jQuery chain that searches the page =====
const CASES = [
  ['Who is in the hall?', () => $('#hall .guest')],
  ['Who is dressed in yellow or purple?', () => $('.c-yellow, .c-purple')],
  ['Which AITU students are upstairs?', () => $('#floor2 .guest.aitu')],
  ['Who has glasses or a bag?', () => $('.has-glasses, .has-bag')],
  ['Who came with nothing at all?', () => $('.guest[data-things=""]')],
  ['Who has a phone but no bag?', () => $('.has-phone:not(.has-bag)')],
  ['Who arrived 20:30 - 21:00?', () => $('.guest').filter(function () {
    const t = $(this).attr('data-time'); return t >= '20:30' && t <= '21:00'; })],
  ['Who arrived after 21:00 and is not AITU?', () => $('.guest:not(.aitu)').filter(function () {
    return $(this).attr('data-time') > '21:00'; })],
  ['Who stands right next to Askar?', () => $('[data-name=Askar]').prev().add($('[data-name=Askar]').next())],
  ['Who stands last in each room?', () => $('.guests .guest:last-child')],
  ['Who stands third in each room?', () => $('.guests .guest:nth-child(3)')],
  ['Who stands after Timur?', () => $('[data-name=Timur]').nextAll()],
  ['Who stands right before someone in black?', () => $('.c-black').prev('.guest')],
  ['In which room is Aruzhan?', () => $('[data-name=Aruzhan]').closest('.room')],
  ['Which rooms have fewer than 6 guests?', () => $('.room:not(:has(.guest:nth-child(6)))')],
  ['Rooms with a cup but no glasses?', () => $('.room:has(.has-cup):not(:has(.has-glasses))')],
  ['Who came first to each room?', () => $('.room').map(function () {
    return $(this).find('.guest').get().sort((a, b) => a.dataset.time.localeCompare(b.dataset.time))[0]; })],
  ['Miras joins Askar and Inkar', () =>
    card(G('Miras', 'blue', '21:20', 1, 'phone')).hide().insertAfter('[data-name=Askar]').fadeIn(800), true],
  ['Natasha goes home', () =>
    $('[data-name=Natasha]').fadeOut(700, function () { $(this).remove(); }), true],
  ['Who took the cake?', () => $('#floor1 .has-crumbs:not(.has-cup)')
    .filter(function () { const t = $(this).attr('data-time'); return t > '21:00' && t < '21:30'; })
    .filter(function () { return $(this).prev('.aitu').add($(this).next('.aitu')).length > 0; })]
];

function run(i) {
  build();                                   // the party is rebuilt before every case
  const [title, find, changesParty] = CASES[i];
  const $found = find();
  $found.addClass('hit');
  if (!changesParty) $found.filter('.guest').animate({ top: -14 }, 150).animate({ top: 0 }, 150);   // one jump
  const names = $found.map(function () {
    return $(this).is('.room') ? $(this).find('h3 span').text() : $(this).attr('data-name');
  }).get();
  $('#result').text('Case ' + (i + 1) + ': ' + title + '  →  ' + $found.length + ': ' + (names.join(', ') || 'nobody'));
  if (window.afterCase) afterCase($found);   // hook used in Task 2
}

CASES.forEach(([title], i) =>
  $('<button>').text((i + 1) + '. ' + title).appendTo('#cases').on('click', () => run(i)));

build();
