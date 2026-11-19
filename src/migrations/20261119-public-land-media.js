/**
 * Make every existing land media row public, except farmer photos and
 * farmer agreements.
 *
 * Media is meant to be public by default (only farmer_photo and
 * farmer_aggrement are private), but the column defaulted to false, so every
 * row was stored private and the buyer endpoints that filter on public = true
 * returned no media at all. landService now defaults the flag by category on
 * create/update; this brings the rows written before that change in line.
 * Runs once — after that, admins can still make individual photos private.
 */
export const name = "20261119-public-land-media";

export const up = async (sequelize, transaction) => {
  const [, result] = await sequelize.query(
    `UPDATE land_media
        SET public = true, updated_at = NOW()
      WHERE category NOT IN ('farmer_photo', 'farmer_aggrement')
        AND public = false`,
    { transaction }
  );
  console.log(`  ${name}: ${result?.rowCount ?? 0} media rows set to public`);
};
