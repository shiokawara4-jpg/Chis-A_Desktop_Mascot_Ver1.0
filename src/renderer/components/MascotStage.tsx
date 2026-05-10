import type { CharacterInstance } from '../../core';

type MascotStageProps = {
  characters: CharacterInstance[];
};

export const MascotStage = ({ characters }: MascotStageProps): JSX.Element => {
  return (
    <section className="mascot-stage" aria-label="Mascot stage">
      <div className="stage-surface">
        {characters.map((character) => (
          <div
            className="placeholder-mascot"
            key={character.instanceId}
            style={{
              left: character.position.x,
              top: character.position.y,
              transform: `translate(-50%, -100%) scale(${character.scale})`,
              zIndex: character.zIndex
            }}
            title={character.characterId}
          >
            <div className="placeholder-mascot__head" />
            <div className="placeholder-mascot__body" />
          </div>
        ))}
      </div>
    </section>
  );
};
