import Training from "../model/trainingModel.js";

export const createTraining = async (data) => {
  try {
    const training = await Training.create(data);
    return training;
  } catch (error) {
    throw error;
  }
};

export const getTraining = async () => {
  const training = await Training.findOne({
    order: [["created_at", "DESC"]],
  });

  if (!training) {
    throw new Error("Training data not found");
  }

  return training;
};

export const updateTraining = async (data) => {
  const training = await Training.findOne();

  if (!training) {
    throw new Error("Training not found");
  }

  await training.update(data);

  return training;
};

export const deleteTraining = async (id) => {
  const training = await Training.findByPk(id);

  if (!training) {
    throw new Error("Training not found");
  }

  await training.destroy();

  return true;
};