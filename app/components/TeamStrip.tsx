'use client';

const teams = [
  {
    name: 'Punjab Kings',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Punjab_Kings_Logo.svg/250px-Punjab_Kings_Logo.svg.png',
    color: '#ED1B24',
  },
  {
    name: 'NY Knicks',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/25/New_York_Knicks_logo.svg/250px-New_York_Knicks_logo.svg.png',
    color: '#006BB6',
  },
  {
    name: 'FC Barcelona',
    logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
    color: '#A50044',
  },
  {
    name: 'Washington Freedom',
    logo: 'https://upload.wikimedia.org/wikipedia/en/d/db/FreedomLogo09.PNG',
    color: '#003087',
  },
];

// duplicate for seamless loop
const items = [...teams, ...teams, ...teams];

export default function TeamStrip() {
  return (
    <div className="team-strip-wrap">
      <div className="team-strip-track">
        {items.map((team, i) => (
          <div className="team-item" key={i}>
            <div
              className="team-logo-ring"
              style={{ borderColor: team.color + '55', background: team.color + '18' }}
            >
              <img
                src={team.logo}
                alt={team.name}
                className="team-logo-img"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <span className="team-logo-fallback" style={{ color: team.color }}>
                {team.name.split(' ').map(w => w[0]).join('')}
              </span>
            </div>
            <span className="team-name">{team.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
