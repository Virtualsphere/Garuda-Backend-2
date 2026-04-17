import Employee from "./employeeModel.js";
import Land from "./landModel.js";
import FarmerDetails from "./farmerDetailsModel.js";
import LandDetails from "./landDetailsModel.js";
import LandGPS from "./landGpsModel.js";
import LandMedia from "./landMediaModel.js";
import LandDocuments from "./landDocumentsModel.js";
import Buyer from "./buyerModel.js";
import RefreshToken from "./refreshTokenModel.js";
import State from "./stateModel.js";
import Village from "./villageModel.js";
import District from "./districtModel.js";
import Mandal from "./mandalModel.js";
import AssignedVillage from "./assignedVillage.js";
import PrimaryVisit from "./primaryVisitModel.js";
import Cart from "./cartModel.js";
import Availibility from "./availbilityModel.js";
import Shortlisting from "./shortlistingModel.js";
import FinalList from "./finalListModel.js";
import Payment from "./paymentModel.js";
import WishList from "./wishlistModel.js";
import Session from "./sessionModel.js";
import SessionExpense from "./sessionExpenseModel.js";
import WorkWallet from "./workWalletModel.js";
import TravelWallet from "./travelWalletModel.js";
import Path from "./pathModel.js";
import LandFeedBack from "./landFeedBackModel.js";
import Agent from "./agentModel.js";

Employee.hasMany(Land, {
  foreignKey: "created_by",
  as: "createdLands",
});

Employee.hasMany(Agent, {
  foreignKey: "refered_by",
  as: "createAgent"
})

Employee.hasMany(LandFeedBack, {
  foreignKey: "employee_id",
  as: "employeeFeedback"
})

Buyer.hasMany(LandFeedBack, {
  foreignKey: "user_id",
  as: "buyerFeedback"
})

Employee.hasMany(AssignedVillage, {
  foreignKey: "assigned_employee_id",
  as: "assignedVillage"
});

Employee.hasMany(Session, {
  foreignKey: "employee_id",
  as: "employeeSession"
});

Employee.hasMany(WorkWallet, {
  foreignKey: "employee_id",
  as: "employeeWorkWallet"
});

Employee.hasMany(TravelWallet, {
  foreignKey: "employee_id",
  as: "employeeTravelWallet"
})

Employee.hasMany(Path, {
  foreignKey: "employee_id",
  as: "employeePath"
})

Session.hasMany(SessionExpense, {
  foreignKey: "session_id",
  as: "sessionExpense"
});

Land.hasMany(PrimaryVisit, {
  foreignKey: "land_id",
  as: "primaryLand"
});

Employee.hasMany(PrimaryVisit, {
  foreignKey: "employee_id",
  as: "primaryEmployee"
});

Buyer.hasMany(PrimaryVisit, {
  foreignKey: "user_id",
  as: "primaryBuyer"
});

State.hasMany(District, {
  foreignKey: "state_id",
  as: "districts",
});

District.belongsTo(State, {
  foreignKey: "state_id",
  as: "state",
});

District.hasMany(Mandal, {
  foreignKey: "district_id",
  as: "mandals",
});

Mandal.belongsTo(District, {
  foreignKey: "district_id",
  as: "district",
});

Mandal.hasMany(Village, {
  foreignKey: "mandal_id",
  as: "villages",
});

Agent.belongsTo(Employee, {
  foreignKey: "refered_by",
  as: "createAgent"
})

Land.hasMany(Cart, {
  foreignKey: "land_id",
  as: "cartLand"
})

Buyer.hasMany(Cart, {
  foreignKey: "user_id",
  as: "cartBuyer"
})

Land.hasMany(Availibility, {
  foreignKey: "land_id",
  as: "availableLand"
});

Buyer.hasMany(Availibility, {
  foreignKey: "user_id",
  as: "availableBuyer"
});

Land.hasMany(Shortlisting, {
  foreignKey: "land_id",
  as: "shortlistingLand"
});

Buyer.hasMany(Shortlisting, {
  foreignKey: "user_id",
  as: "shortlistingBuyer"
});

Land.hasMany(FinalList, {
  foreignKey: "land_id",
  as: "finalLand"
});

Buyer.hasMany(FinalList, {
  foreignKey: "user_id",
  as: "finalBuyer"
});

Land.hasMany(Payment, {
  foreignKey: "land_id",
  as: "paymentLand"
});

Buyer.hasMany(Payment, {
  foreignKey: "user_id",
  as: "paymentBuyer"
});

Land.hasMany(WishList, {
  foreignKey: "land_id",
  as: "wishListLand"
});

Buyer.hasMany(WishList, {
  foreignKey: "user_id",
  as: "wishListBuyer"
});

Availibility.belongsTo(Land, {
  foreignKey: "land_id",
  as: "availibilityLand"
})

Availibility.belongsTo(Buyer, {
  foreignKey: "user_id",
  as: "availibilityBuyer"
})

Session.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employeeSession"
})

SessionExpense.belongsTo(Session, {
  foreignKey: "session_id",
  as: "sessionExpense"
})

PrimaryVisit.belongsTo(Land, {
  foreignKey: "land_id",
  as: "primaryVisitLand"
});

PrimaryVisit.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "primaryVisitEmployee"
});

PrimaryVisit.belongsTo(Buyer, {
  foreignKey: "user_id",
  as: "primaryVisitBuyer"
});

Shortlisting.belongsTo(Land, {
  foreignKey: "land_id",
  as: "shortlistLand"
})

Shortlisting.belongsTo(Buyer, {
  foreignKey: "user_id",
  as: "shortlistBuyer"
})

Cart.belongsTo(Land, {
  foreignKey: "land_id",
  as: "cartLand"
})

Cart.belongsTo(Buyer, {
  foreignKey: "user_id",
  as: "cartBuyer"
})

FinalList.belongsTo(Land, {
  foreignKey: "land_id",
  as: "finalizeLand"
})

FinalList.belongsTo(Buyer, {
  foreignKey: "user_id",
  as: "finalizeBuyer"
})

Payment.belongsTo(Land, {
  foreignKey: "land_id",
  as: "paymentLands"
})

Payment.belongsTo(Buyer, {
  foreignKey: "user_id",
  as: "paymentBuyers"
})

WishList.belongsTo(Land, {
  foreignKey: "land_id",
  as: "wishListLands"
})

WishList.belongsTo(Buyer, {
  foreignKey: "user_id",
  as: "wishListBuyers"
})

Village.belongsTo(Mandal, {
  foreignKey: "mandal_id",
  as: "mandal",
});

AssignedVillage.belongsTo(Employee, {
  foreignKey: "assigned_employee_id",
  as: "assigned"
});

Land.belongsTo(Employee, {
  foreignKey: "created_by",
  as: "creator",
});

WorkWallet.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employeeWorkWallet"
})

TravelWallet.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employeeTravelWallet"
})

Path.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employeePath"
})

LandFeedBack.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employeeFeedback"
})

LandFeedBack.belongsTo(Buyer, {
  foreignKey: "user_id",
  as: "buyerFeedback"
})

Employee.hasMany(Land, {
  foreignKey: "verified_by",
  as: "verifiedLands",
});

Land.belongsTo(Employee, {
  foreignKey: "verified_by",
  as: "verifier",
});

Land.hasOne(FarmerDetails, {
  foreignKey: "land_id",
  as: "farmerDetails",
  onDelete: "CASCADE",
});

FarmerDetails.belongsTo(Land, {
  foreignKey: "land_id",
  as: "land",
});

Land.hasOne(LandDetails, {
  foreignKey: "land_id",
  as: "landDetails",
  onDelete: "CASCADE",
});

LandDetails.belongsTo(Land, {
  foreignKey: "land_id",
  as: "land",
});

Land.hasOne(LandGPS, {
  foreignKey: "land_id",
  as: "gps",
  onDelete: "CASCADE",
});

LandGPS.belongsTo(Land, {
  foreignKey: "land_id",
  as: "land",
});

Land.hasMany(LandMedia, {
  foreignKey: "land_id",
  as: "media",
  onDelete: "CASCADE",
});

LandMedia.belongsTo(Land, {
  foreignKey: "land_id",
  as: "land",
});

Land.hasMany(LandDocuments, {
  foreignKey: "land_id",
  as: "documents",
  onDelete: "CASCADE",
});

LandDocuments.belongsTo(Land, {
  foreignKey: "land_id",
  as: "land",
});

export {
  Land,
  FarmerDetails,
  LandDetails,
  LandGPS,
  LandMedia,
  LandDocuments,
  Employee,
  RefreshToken,
  Buyer,
  State,
  District,
  Village,
  Mandal,
  AssignedVillage,
  PrimaryVisit,
  Availibility,
  Shortlisting,
  FinalList,
  WishList,
  Payment,
  Cart,
  Session,
  SessionExpense,
  WorkWallet,
  TravelWallet,
  Path,
  LandFeedBack,
  Agent
};