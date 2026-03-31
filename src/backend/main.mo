import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";

actor {
  type Review = {
    toolId : Text;
    rating : Nat;
    comment : Text;
    timestamp : Int;
  };

  let reviews = Map.empty<Nat, Review>();
  var nextId = 0;

  func getReviewInternal(id : Nat) : Review {
    switch (reviews.get(id)) {
      case (null) { Runtime.trap("Review does not exist") };
      case (?review) { review };
    };
  };

  public shared ({ caller }) func submitReview(toolId : Text, rating : Nat, comment : Text) : async Nat {
    if (rating < 1 or rating > 5) {
      Runtime.trap("Rating must be between 1 and 5");
    };

    let review : Review = {
      toolId;
      rating;
      comment;
      timestamp = Time.now();
    };

    let id = nextId;
    reviews.add(id, review);
    nextId += 1;
    id;
  };

  public query ({ caller }) func getReview(id : Nat) : async Review {
    getReviewInternal(id);
  };

  public query ({ caller }) func getAllReviewsByTool(toolId : Text) : async [Review] {
    let filtered = reviews.values().toArray().filter(
      func(review : Review) : Bool {
        Text.equal(review.toolId, toolId);
      }
    );
    filtered.sort(func(a : Review, b : Review) : Order.Order {
      Int.compare(b.timestamp, a.timestamp);
    });
  };
};
