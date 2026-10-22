/**
 * Make every existing farmer photo and farmer agreement private.
 *
 * New lands already get public = false for these categories in createLand;
 * this brings the rows created before that change in line. Runs once — after
 * that, admins can publish individual photos from the verification form.
 */
export const name = "20261022-private-farmer-media";

export const up = async (sequelize, transaction) => {
  const [, result] = await sequelize.query(
    `UPDATE land_media
        SET public = false, updated_at = NOW()
      WHERE category IN ('farmer_photo', 'farmer_aggrement')
        AND public = true`,
    { transaction }
  );
  console.log(`  ${name}: ${result?.rowCount ?? 0} media rows set to private`);
};
